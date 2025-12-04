#!/usr/bin/env python3
"""
Test script to see what PaddleOCR actually returns
"""

from paddleocr import PaddleOCR
import sys
import json

# Initialize PaddleOCR
print("Initializing PaddleOCR...")
ocr = PaddleOCR(lang='en', use_angle_cls=True, use_gpu=False)
print("PaddleOCR initialized!")

# Get image path from command line or use a test image
if len(sys.argv) > 1:
    image_path = sys.argv[1]
else:
    print("Usage: python test_paddleocr.py <image_path>")
    sys.exit(1)

print(f"\nProcessing image: {image_path}")

# Run OCR
result = ocr.ocr(image_path, cls=True)

print(f"\nResult type: {type(result)}")
print(f"Result is list: {isinstance(result, list)}")
if result:
    print(f"Number of pages: {len(result)}")
    
    for page_idx, page_result in enumerate(result):
        print(f"\n=== Page {page_idx + 1} ===")
        print(f"Page result type: {type(page_result)}")
        print(f"Page result is list: {isinstance(page_result, list)}")
        if page_result:
            print(f"Number of detections: {len(page_result)}")
            
            # Show first 3 detections in detail
            for i, detection in enumerate(page_result[:3]):
                print(f"\n--- Detection {i} ---")
                print(f"Type: {type(detection)}")
                print(f"Is list/tuple: {isinstance(detection, (list, tuple))}")
                if isinstance(detection, (list, tuple)):
                    print(f"Length: {len(detection)}")
                    for j, item in enumerate(detection):
                        print(f"  Item {j}: type={type(item)}, value={item}")
                else:
                    print(f"Value: {detection}")
            
            # Extract and print all text
            print(f"\n=== Extracted Text (Page {page_idx + 1}) ===")
            texts = []
            for detection in page_result:
                if isinstance(detection, (list, tuple)) and len(detection) >= 2:
                    text_info = detection[1]
                    if isinstance(text_info, (list, tuple)) and len(text_info) >= 1:
                        text = str(text_info[0])
                        texts.append(text)
            print('\n'.join(texts))
        else:
            print("No detections on this page")

