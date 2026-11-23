# FishFreshNet evaluation protocol

This directory provides an auditable split and a common V1/V2 evaluation runner. It does not establish new accuracy claims or alter deployed weights. The repository does not include the full MFED/FFE images, authoritative fish identities, acquisition-batch manifest, or a trace from each published metric to the exact released checkpoint and split. **Do not infer fish IDs from filenames or appearance.** Obtain documented IDs and permission to use the data before evaluating. MFED source: https://data.mendeley.com/datasets/67nmx3mhwh/2. Verify the FFE release and version from its authoritative provider before use.

## Audit at GitHub baseline c5d901979731603f18fca83c526bd1272ab90bd6

- `fishfreshnet_v1/data.py` creates five seeded 70/20/10 random **image** splits by default. `train.py` selects a checkpoint on validation accuracy and saves per-run test metrics and weights.
- `fishfreshnet_v2/data.py` creates seeded 70/20/10 **image-level stratified** splits. `train.py` selects a checkpoint using its configured validation metric and saves per-run results. Neither split guarantees fish or batch independence.
- The repository V1 weight and Space V1 file have the same SHA-256: `4d3692bd9088dc6415fa8f637d97282b831bda711fc15a010f4ffbd976620edb`. The corresponding V2 files match at `5f84b069e06afc5c35f940b9432cd267745d08a6ca6cb039a73557d00682437e`. This establishes local file equality, not which run, split, data release or metrics produced the weights, nor what is deployed in a remote Space.
- Existing published MFED and FFE figures remain historical claims under their original protocols. Their connection to these exact weight hashes and their per-fish independence remain unverified; do not relabel them as results of this protocol.

## Manifest and splitting

Provide UTF-8 CSV with columns `dataset,sample_id,fish_id,batch_id,path,label`. `fish_id` must be a **global**, authoritative individual identifier shared by every image of the same fish, including across datasets. Distinct fish need distinct identifiers. `sample_id` is unique within a dataset. `batch_id` is optional unless using `--holdout-batch`, when every row must have a verified globally meaningful batch ID. Paths are relative to a data root. Labels are 0 = Highly Fresh, 1 = Fresh, 2 = Not Fresh, consistent with the deployed API. Keep manifest and outputs private if they contain restricted IDs or paths.

```sh
python models/evaluation/run.py split --manifest /data/manifest.csv --output /data/split.csv --seed 42
# Optional: hold one or more entire collection batches out for testing.
python models/evaluation/run.py split --manifest /data/manifest.csv --output /data/batch-split.csv --seed 42 --holdout-batch batch-2025-01
```

The normal split shuffles sorted fish IDs with the specified seed and assigns approximately 70/20/10 **groups**, not images, to train/validation/test; small samples and class imbalance can alter image proportions. It is not class-stratified. Inspect counts and class coverage before training. The optional batch holdout assigns all images of every fish occurring in a held-out batch to test, even if that fish also occurs in another batch. The remaining fish are split into train and validation. The CSV is the group assignment manifest; the adjacent `.meta.json` records seed, batch choice, group counts, and input/output hashes. Preserve both alongside any experiment. Validation rejects missing IDs, duplicate dataset/sample IDs, missing splits, and fish crossing splits. Evaluation also rejects byte-identical images across splits; this does not detect visually similar duplicates or incorrect supplied IDs.

## Evaluation

Use Python 3.12 and the dependencies in `hf-space/requirements.txt`. The runner loads both explicitly supplied checkpoints using the deployed model definitions and 224×224 preprocessing, evaluates the same test rows on CPU, and writes counts, dataset-specific confusion matrices, per-class precision/recall/F1, errors, 10-bin expected calibration error, multiclass Brier score and accuracy/coverage at 0, 0.6 and 0.8. Thresholds are descriptive and **not calibrated safety cutoffs**. A separate dataset in the manifest can provide a cross-dataset result; record its identity and provenance.

```sh
python models/evaluation/run.py evaluate --manifest /data/split.csv --data-root /data/images \
  --weights-v1 models/fishfreshnet_v1.pth --weights-v2 models/fishfreshnetv2.pth \
  --dataset-version 'document exact releases' --source-revision 'full Git SHA' \
  --training-provenance 'describe exact training data and checkpoint lineage' --output /data/evaluation.json
```

The output records manifest, input-image and weight hashes, supplied data version, source revision and training provenance. These descriptions are operator-supplied, not automatically verified. Error records contain sample IDs and paths. Store them only where authorized. Fixed published weights may already have seen test fish; a group-disjoint evaluation manifest alone **does not prove an independent test**. For a valid held-out evaluation, first train both models using the same saved group-disjoint train/validation split, record the training code, data, weights and selection procedure, then evaluate the untouched test split once. Keep historical image-split results separate from new group-split results, and use a separate validation set for threshold selection before testing. No new MFED/FFE results are supplied here.

## Verification without real data

`python -m unittest discover -s models/evaluation -p 'test_*.py' -v` tests deterministic grouping, batch holdout, leakage rejection and metrics with clearly synthetic fixtures. A local smoke run with synthetic solid-color images can exercise the runner and real weight loading, but its metrics are not model performance evidence.
