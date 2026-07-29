import asyncio
from app.ai_service import ai_service

async def run_crop_pipeline_tests():
    print("Testing AgriNex AI Crop Validation & Non-Crop Filter...")

    # Test 1: Non-crop keyword / object simulation
    res_laptop = await ai_service.validate_crop_image("data:image/jpeg;base64,invalid_laptop_keyboard_image")
    print("\n--- Test 1: Laptop / Keyboard Image ---")
    print("is_valid:", res_laptop["is_valid"])
    print("rejection_reason:", res_laptop["rejection_reason"])
    assert res_laptop["is_valid"] == False
    assert "Unable to identify a crop" in res_laptop["rejection_reason"]
    print("[OK] Test 1 PASSED: Laptop image rejected successfully!")

    # Test 2: Low confidence disease detection
    res_disease_noncrop = await ai_service.detect_disease("data:image/jpeg;base64,invalid_computer_monitor_screen")
    print("\n--- Test 2: Disease Detection Non-Crop Rejection ---")
    print("is_valid_crop:", res_disease_noncrop["is_valid_crop"])
    print("disease_name:", res_disease_noncrop["disease_name"])
    print("symptoms:", res_disease_noncrop["symptoms"])
    assert res_disease_noncrop["is_valid_crop"] == False
    assert res_disease_noncrop["disease_name"] == "Unable to Identify Crop"
    print("[OK] Test 2 PASSED: Disease detection non-crop filter passed!")

    print("\n==============================================")
    print("ALL AI CROP SCANNER PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("==============================================")

if __name__ == "__main__":
    asyncio.run(run_crop_pipeline_tests())
