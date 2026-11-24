"""Split supplied fish IDs and evaluate V1/V2 under one explicit protocol."""
import argparse
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
from collections import defaultdict

from evaluation import grouped_split, summarize, validate_split

ROOT = Path(__file__).resolve().parents[2]
FIELDS = ['dataset', 'sample_id', 'fish_id', 'batch_id', 'path', 'label', 'split']


def file_hash(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as source:
        for part in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(part)
    return digest.hexdigest()


def read_manifest(path):
    with open(path, newline='', encoding='utf-8-sig') as source:
        return list(csv.DictReader(source))


def safe_path(root, value):
    root = root.resolve()
    candidate = (root / value).resolve()
    if not candidate.is_relative_to(root) or not candidate.is_file():
        raise ValueError(f'missing or out-of-root image: {value}')
    return candidate


def write_split(args):
    if Path(args.manifest).resolve() in {Path(args.output).resolve(), Path(args.output + '.meta.json').resolve()}:
        raise ValueError('output must not overwrite the input manifest')
    rows = grouped_split(read_manifest(args.manifest), args.seed, set(args.holdout_batch))
    with open(args.output, 'w', newline='', encoding='utf-8') as target:
        writer = csv.DictWriter(target, fieldnames=FIELDS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)
    metadata = {'protocol': 'grouped-fish-manifest-v1', 'seed': args.seed,
                'holdout_batches': args.holdout_batch, 'input_sha256': file_hash(args.manifest),
                'output_sha256': file_hash(args.output),
                'group_counts': {split: len({r['fish_id'] for r in rows if r['split'] == split})
                                 for split in ('train', 'val', 'test')}}
    Path(args.output + '.meta.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'wrote {len(rows)} samples; grouped by supplied fish ID')


def run_evaluation(args):
    import torch
    from PIL import Image

    rows = read_manifest(args.manifest)
    validate_split(rows)
    if not any(row['split'] == 'test' for row in rows):
        raise ValueError('manifest has no test samples')
    root = Path(args.data_root)
    hashes = {}
    for row in rows:
        path = safe_path(root, row['path'])
        digest = file_hash(path)
        if digest in hashes and hashes[digest] != row['split']:
            raise ValueError('identical image bytes appear in multiple splits')
        hashes[digest] = row['split']
        row['_path'] = path
        row['_sha256'] = digest

    protected = {Path(args.manifest).resolve(), Path(args.weights_v1).resolve(), Path(args.weights_v2).resolve()}
    protected.update(row['_path'] for row in rows)
    if Path(args.output).resolve() in protected:
        raise ValueError('output must not overwrite a manifest, weight or image')

    app_path = ROOT / 'hf-space' / 'app.py'
    spec = importlib.util.spec_from_file_location('fresheye_eval_service', app_path)
    service = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = service
    spec.loader.exec_module(service)
    service.V1_MODEL_PATH = str(Path(args.weights_v1).resolve())
    service.V2_MODEL_PATH = str(Path(args.weights_v2).resolve())
    models = {'v1': service.load_v1_model('cpu').eval(), 'v2': service.load_v2_model('cpu').eval()}
    results = {name: defaultdict(list) for name in models}
    mistakes = []
    with torch.inference_mode():
        for row in rows:
            if row['split'] != 'test':
                continue
            with Image.open(row['_path']) as source:
                image = source.convert('RGB')
                tensor = service.preprocess(image).unsqueeze(0)
            for name, model in models.items():
                probabilities = torch.softmax(model(tensor), dim=1)[0].tolist()
                label = int(row['label'])
                predicted = max(range(3), key=lambda i: probabilities[i])
                results[name][row['dataset']].append({'label': label, 'probabilities': probabilities})
                if predicted != label:
                    mistakes.append({'model': name, 'dataset': row['dataset'], 'sample_id': row['sample_id'],
                                     'path': row['path'], 'label': label, 'predicted': predicted,
                                     'probabilities': probabilities})
    output = {
        'protocol': 'grouped-fish-manifest-v1', 'dataset_version': args.dataset_version,
        'source_revision_claimed': args.source_revision, 'training_provenance': args.training_provenance,
        'independence_notice': 'Group-disjoint manifest does not prove existing weights were trained without test fish.',
        'manifest_sha256': file_hash(args.manifest), 'image_sha256': {f"{r['dataset']}:{r['sample_id']}": r['_sha256'] for r in rows},
        'weights_sha256': {name: file_hash(path) for name, path in [('v1', args.weights_v1), ('v2', args.weights_v2)]},
        'torch_version': torch.__version__, 'device': 'cpu', 'class_order': ['Highly Fresh', 'Fresh', 'Not Fresh'],
        'counts': {split: sum(row['split'] == split for row in rows) for split in ('train', 'val', 'test')},
        'models': {name: {dataset: summarize(items) for dataset, items in datasets.items()} for name, datasets in results.items()},
        'errors': mistakes,
    }
    Path(args.output).write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"wrote evaluation for {output['counts']['test']} test samples per model")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    split = sub.add_parser('split', help='split by supplied global fish ID')
    split.add_argument('--manifest', required=True)
    split.add_argument('--output', required=True)
    split.add_argument('--seed', type=int, default=42)
    split.add_argument('--holdout-batch', action='append', default=[])
    split.set_defaults(func=write_split)
    evaluate = sub.add_parser('evaluate', help='evaluate both weights on the same test manifest')
    for name in ('manifest', 'data-root', 'weights-v1', 'weights-v2', 'dataset-version', 'source-revision', 'training-provenance', 'output'):
        evaluate.add_argument('--' + name, required=True)
    evaluate.set_defaults(func=run_evaluation)
    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
