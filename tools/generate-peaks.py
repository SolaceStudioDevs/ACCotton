"""Decode each reel once and emit normalized waveform peaks.

The design prototype generated bar heights from a seeded PRNG. Real peaks
mean the waveform actually corresponds to the audio, so click-to-scrub
lands where the listener expects. Emitted at both bar counts the design
uses (96 collapsed, 134 expanded) so the client does no resampling.
"""
import json, math, sys, array
import miniaudio

COUNTS = (96, 134)
RATE = 8000          # plenty for envelope extraction
FLOOR = 0.20         # below this a bar reads as a gap, not quiet audio

def buckets(samples, n):
    """Per-bucket blend of RMS (body) and peak (transients)."""
    total = len(samples)
    out = []
    for i in range(n):
        lo = (i * total) // n
        hi = max(lo + 1, ((i + 1) * total) // n)
        seg = samples[lo:hi]
        peak = 0
        acc = 0.0
        for s in seg:
            a = s if s >= 0 else -s
            if a > peak:
                peak = a
            acc += float(s) * float(s)
        rms = math.sqrt(acc / len(seg))
        out.append((rms / 32768.0, peak / 32768.0))
    return out

def shape(pairs):
    """Normalize per reel, then expand contrast.

    Long-form speech is level-compressed and each bar averages several
    seconds, so raw normalized values cluster near the mean and the wave
    reads as a solid block. Anchoring the 5th/95th percentiles to the
    ends of the range restores visible motion without inventing detail.
    """
    rms_max = max(p[0] for p in pairs) or 1.0
    pk_max = max(p[1] for p in pairs) or 1.0
    # Peak weighted over RMS: transients vary far more than averaged level.
    vals = [0.35 * (r / rms_max) + 0.65 * (k / pk_max) for r, k in pairs]

    ordered = sorted(vals)
    lo = ordered[int(0.05 * (len(ordered) - 1))]
    hi = ordered[int(0.95 * (len(ordered) - 1))]
    span = (hi - lo) or 1.0

    out = []
    for v in vals:
        t = (v - lo) / span
        t = 0.0 if t < 0.0 else 1.0 if t > 1.0 else t
        t = t ** 0.85                  # ease the low end up off the floor
        out.append(round(FLOOR + (1.0 - FLOOR) * t, 3))
    return out

def main(paths, out_path):
    result = {}
    for slug, path in paths:
        dec = miniaudio.decode_file(
            path, output_format=miniaudio.SampleFormat.SIGNED16,
            nchannels=1, sample_rate=RATE)
        samples = dec.samples
        entry = {"duration": round(len(samples) / RATE, 2)}
        for n in COUNTS:
            entry[str(n)] = shape(buckets(samples, n))
        result[slug] = entry
        print(f"{slug:30s} {entry['duration']:7.1f}s  "
              f"min={min(entry['134']):.2f} max={max(entry['134']):.2f} "
              f"mean={sum(entry['134'])/134:.2f}")
    with open(out_path, "w") as f:
        json.dump(result, f, separators=(",", ":"))
    print("wrote", out_path)

if __name__ == "__main__":
    import os
    d = sys.argv[1]
    files = [(f[:-4], os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith(".mp3")]
    main(files, sys.argv[2])
