import numpy as np
import onnx
import onnxruntime as ort
import torch

from model import HalfDigitCNN


def export_to_onnx(model, output_path):
    """
    Export trained PyTorch model to ONNX format.
    Input shape: [batch, 1, 21, 26] (grayscale, normalized).
    Output shape: [batch, 10] (logits per digit class).
    """
    model.eval()
    dummy_input = torch.randn(1, 1, 21, 26)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
    )

    # Validate
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)

    # Verify output parity
    _verify_onnx_output(model, output_path, dummy_input)
    print(f"ONNX model exported and verified: {output_path}")


def _verify_onnx_output(pytorch_model, onnx_path, dummy_input):
    """Verify ONNX output matches PyTorch output within tolerance."""
    pytorch_model.eval()
    with torch.no_grad():
        pytorch_output = pytorch_model(dummy_input).numpy()

    session = ort.InferenceSession(onnx_path)
    onnx_output = session.run(None, {"input": dummy_input.numpy()})[0]

    np.testing.assert_allclose(pytorch_output, onnx_output, rtol=1e-5, atol=1e-5)
    print("ONNX output verified: matches PyTorch output")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python export_onnx.py <checkpoint.pt> <output.onnx>")
        sys.exit(1)

    checkpoint_path = sys.argv[1]
    output_path = sys.argv[2]

    model = HalfDigitCNN(num_classes=10)
    model.load_state_dict(torch.load(checkpoint_path, weights_only=True))
    export_to_onnx(model, output_path)
