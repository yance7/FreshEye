"""Dataset-agnostic grouping and metrics. Fish IDs must be supplied, never inferred."""
import math
import random
from collections import defaultdict

CLASSES = (0, 1, 2)
SPLITS = ('train', 'val', 'test')


def _validated(rows):
    if not rows:
        raise ValueError('manifest is empty')
    seen = set()
    out = []
    for row in rows:
        row = dict(row)
        for key in ('dataset', 'sample_id', 'fish_id', 'path'):
            if not str(row.get(key, '')).strip():
                raise ValueError(f'{key} is required')
            row[key] = str(row[key]).strip()
        try:
            row['label'] = int(row['label'])
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError('label must be 0, 1 or 2') from exc
        if row['label'] not in CLASSES:
            raise ValueError('label must be 0, 1 or 2')
        key = (row['dataset'], row['sample_id'])
        if key in seen:
            raise ValueError(f'duplicate sample ID: {key}')
        seen.add(key)
        out.append(row)
    return out


def grouped_split(rows, seed=42, heldout_batches=None):
    rows = _validated(rows)
    groups = sorted({r['fish_id'] for r in rows})
    if len(groups) < 3:
        raise ValueError('at least three distinct fish groups are required')
    random.Random(seed).shuffle(groups)
    if heldout_batches:
        if any(not str(r.get('batch_id', '')).strip() for r in rows):
            raise ValueError('batch_id is required for batch holdout')
        if not set(heldout_batches).issubset({r['batch_id'] for r in rows}):
            raise ValueError('a requested holdout batch is absent from the manifest')
        heldout = {r['fish_id'] for r in rows if r['batch_id'] in heldout_batches}
        if not heldout or len(groups) - len(heldout) < 2:
            raise ValueError('batch holdout needs test fish and at least two remaining fish')
        remaining = [group for group in groups if group not in heldout]
        n_train = max(1, min(len(remaining) - 1, int(len(remaining) * 0.78)))
        assignments = {group: ('train' if i < n_train else 'val') for i, group in enumerate(remaining)}
        assignments.update({group: 'test' for group in heldout})
        result = [dict(r, split=assignments[r['fish_id']]) for r in rows]
        result.sort(key=lambda r: (r['dataset'], r['sample_id']))
        validate_split(result)
        return result
    n_train = max(1, int(len(groups) * 0.7))
    n_val = max(1, int(len(groups) * 0.2))
    if n_train + n_val >= len(groups):
        n_train = len(groups) - n_val - 1
    assignments = {group: ('train' if i < n_train else 'val' if i < n_train + n_val else 'test')
                   for i, group in enumerate(groups)}
    result = [dict(r, split=assignments[r['fish_id']]) for r in rows]
    result.sort(key=lambda r: (r['dataset'], r['sample_id']))
    validate_split(result)
    return result


def validate_split(rows):
    rows = _validated(rows)
    if {r.get('split') for r in rows} != set(SPLITS):
        raise ValueError('manifest must include train, val and test')
    groups = {}
    for row in rows:
        split = row.get('split')
        if split not in SPLITS:
            raise ValueError('split must be train, val or test')
        group = row['fish_id']
        if group in groups and groups[group] != split:
            raise ValueError(f'fish crosses splits: {group}')
        groups[group] = split
    return True


def summarize(predictions, thresholds=(0.0, 0.6, 0.8)):
    if not predictions:
        raise ValueError('no predictions')
    matrix = [[0] * 3 for _ in CLASSES]
    records = []
    for row in predictions:
        label = int(row['label'])
        probs = [float(x) for x in row['probabilities']]
        if label not in CLASSES or len(probs) != 3 or any(not math.isfinite(x) or x < 0 or x > 1 for x in probs) or abs(sum(probs) - 1) > 1e-4:
            raise ValueError('invalid label or probabilities')
        predicted = max(CLASSES, key=lambda i: probs[i])
        matrix[label][predicted] += 1
        records.append((label, predicted, probs[predicted], probs))
    n = len(records)
    classes = []
    for i in CLASSES:
        tp = matrix[i][i]
        actual = sum(matrix[i])
        predicted = sum(matrix[j][i] for j in CLASSES)
        precision = tp / predicted if predicted else 0.0
        recall = tp / actual if actual else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        classes.append({'label': i, 'support': actual, 'precision': precision, 'recall': recall, 'f1': f1})
    ece = 0.0
    for bin_index in range(10):
        group = [r for r in records if min(int(r[2] * 10), 9) == bin_index]
        if group:
            ece += len(group) / n * abs(sum(r[2] for r in group) / len(group) - sum(r[0] == r[1] for r in group) / len(group))
    threshold_results = {}
    for threshold in thresholds:
        if not 0 <= threshold <= 1:
            raise ValueError('threshold must be between 0 and 1')
        accepted = [r for r in records if r[2] >= threshold]
        threshold_results[str(threshold)] = {'accepted': len(accepted), 'coverage': len(accepted) / n,
            'accuracy': sum(r[0] == r[1] for r in accepted) / len(accepted) if accepted else None}
    return {'sample_count': n, 'accuracy': sum(matrix[i][i] for i in CLASSES) / n,
            'confusion_matrix': matrix, 'classes': classes, 'ece_10_bins': ece,
            'multiclass_brier': sum(sum((r[3][i] - (r[0] == i)) ** 2 for i in CLASSES) for r in records) / n,
            'thresholds': threshold_results}
