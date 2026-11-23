import unittest
import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from evaluation import grouped_split, validate_split, summarize


class EvaluationTests(unittest.TestCase):
    def rows(self):
        return [dict(dataset='MFED', sample_id=f'{fish}-{view}', fish_id=fish,
                     batch_id='b1', path=f'{fish}-{view}.jpg', label=view % 3)
                for fish in ('f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10')
                for view in (0, 1)]

    def test_group_split_is_reproducible_and_no_fish_crosses(self):
        first = grouped_split(self.rows(), seed=42)
        self.assertEqual(first, grouped_split(list(reversed(self.rows())), seed=42))
        validate_split(first)
        self.assertEqual({row['split'] for row in first}, {'train', 'val', 'test'})
        self.assertEqual(len(first), len(self.rows()))

    def test_shared_global_fish_id_cannot_cross_datasets(self):
        rows = self.rows()
        rows[0]['dataset'] = 'FFE'
        split = grouped_split(rows, seed=42)
        self.assertEqual(len({r['split'] for r in split if r['fish_id'] == 'f1'}), 1)

    def test_missing_identity_and_cross_split_leak_are_rejected(self):
        rows = self.rows()
        rows[0]['fish_id'] = ''
        with self.assertRaises(ValueError):
            grouped_split(rows, seed=42)
        split = grouped_split(self.rows(), seed=42)
        same_fish = [row for row in split if row['fish_id'] == 'f1']
        same_fish[0]['split'], same_fish[1]['split'] = 'train', 'test'
        with self.assertRaises(ValueError):
            validate_split(split)

    def test_batch_holdout_keeps_all_views_of_held_out_fish_in_test(self):
        rows = self.rows()
        rows[0]['batch_id'] = 'holdout'
        split = grouped_split(rows, seed=42, heldout_batches={'holdout'})
        self.assertEqual({r['split'] for r in split if r['fish_id'] == 'f1'}, {'test'})
        validate_split(split)

    def test_manifest_must_contain_all_splits(self):
        split = grouped_split(self.rows(), seed=42)
        for row in split:
            row['split'] = 'test'
        with self.assertRaises(ValueError):
            validate_split(split)

    def test_split_cli_records_seed_and_manifest_hashes(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / 'input.csv', Path(tmp) / 'split.csv'
            with source.open('w', newline='', encoding='utf-8') as stream:
                writer = csv.DictWriter(stream, fieldnames=list(self.rows()[0]))
                writer.writeheader()
                writer.writerows(self.rows())
            subprocess.run([sys.executable, str(Path(__file__).with_name('run.py')), 'split', '--manifest', str(source), '--output', str(output), '--seed', '17'], check=True, capture_output=True)
            metadata = json.loads(Path(str(output) + '.meta.json').read_text(encoding='utf-8'))
            self.assertEqual(metadata['seed'], 17)
            self.assertEqual(len(metadata['input_sha256']), 64)
            self.assertEqual(len(metadata['output_sha256']), 64)

    def test_metrics_and_rejection_report(self):
        predictions = [
            {'label': 0, 'probabilities': [0.8, 0.1, 0.1]},
            {'label': 1, 'probabilities': [0.6, 0.3, 0.1]},
            {'label': 2, 'probabilities': [0.1, 0.1, 0.8]},
        ]
        result = summarize(predictions, thresholds=[0.0, 0.7])
        self.assertEqual(result['confusion_matrix'], [[1,0,0],[1,0,0],[0,0,1]])
        self.assertEqual(result['classes'][1]['recall'], 0.0)
        self.assertAlmostEqual(result['accuracy'], 2 / 3)
        self.assertAlmostEqual(result['thresholds']['0.7']['coverage'], 2 / 3)
        self.assertEqual(result['thresholds']['0.7']['accuracy'], 1.0)


if __name__ == '__main__':
    unittest.main()
