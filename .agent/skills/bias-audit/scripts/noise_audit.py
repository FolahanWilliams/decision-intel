import sys
import json
import math
import argparse

def calculate_noise_stats(scores, target_value=None):
    """
    Calculates noise statistics for a set of independent judgments (scores).
    
    Args:
        scores (list[float]): List of score ratings from independent agents.
        target_value (float, optional): The "true" or "ideal" score if known.
                                        If not provided, we use the mean as the best estimate.
    
    Returns:
        dict: {
            "mean": float,
            "std_dev": float, // This is the primary "Noise" metric
            "variance": float,
            "mse": float | None // Mean Squared Error if target is known
        }
    """
    if not scores:
        return {"error": "No scores provided"}
        
    n = len(scores)
    mean = sum(scores) / n
    
    variance = sum((x - mean) ** 2 for x in scores) / n
    std_dev = math.sqrt(variance)
    
    result = {
        "mean": round(mean, 2),
        "median": sorted(scores)[n // 2],
        "std_dev": round(std_dev, 2),
        "variance": round(variance, 2),
        "raw_scores": scores
    }
    
    if target_value is not None:
        # MSE = Bias^2 + Noise^2
        # Here Bias = (Mean - Target)
        bias = mean - target_value
        mse = (bias ** 2) + variance
        result["mse"] = round(mse, 2)
        result["bias_component"] = round(bias, 2)
    
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate Decision Noise Statistics")
    parser.add_argument("--scores", type=float, nargs="+", required=True, help="List of independent judge scores")
    parser.add_argument("--target", type=float, help="True target value (optional)")
    
    args = parser.parse_args()
    
    stats = calculate_noise_stats(args.scores, args.target)
    print(json.dumps(stats, indent=2))
