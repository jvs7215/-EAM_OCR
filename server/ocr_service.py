#!/usr/bin/env python3
"""
PaddleOCR Service for EAM OCR
Provides OCR functionality via HTTP API
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile
from paddleocr import PaddleOCR
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="EAM OCR Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR (lazy load on first request)
ocr_engine = None

def get_ocr_engine():
    """Lazy initialization of PaddleOCR"""
    global ocr_engine
    if ocr_engine is None:
        try:
            logger.info("Initializing PaddleOCR engine...")
            # Initialize with English language only
            # PaddleOCR will download models on first use
            ocr_engine = PaddleOCR(
                lang='en',
                use_angle_cls=True,  # Enable text direction classification
                use_gpu=False,  # Set to True if you have GPU support
                use_space_char=True  # Preserve spaces in text
            )
            logger.info("PaddleOCR engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to initialize OCR engine: {str(e)}")
    return ocr_engine

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "paddleocr"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "EAM OCR Service is running", "status": "ok"}

@app.post("/api/ocr")
async def process_ocr(file: UploadFile = File(...)):
    """
    Process image file with PaddleOCR
    Returns extracted text and confidence score
    
    PaddleOCR result format:
    [
        [  # Page 1
            [[x1,y1], [x2,y2], [x3,y3], [x4,y4]], (text, confidence),
            ...
        ],
        [  # Page 2 (if multi-page)
            ...
        ]
    ]
    """
    tmp_path = None
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Please upload an image or PDF.")

        # Get file extension from filename
        file_ext = os.path.splitext(file.filename or 'image.jpg')[1] or '.jpg'
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Empty file uploaded")
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        logger.info(f"Saved temporary file: {tmp_path}, size: {len(content)} bytes, type: {file.content_type}")
        
        try:
            # Get OCR engine
            ocr = get_ocr_engine()
            
            logger.info(f"Processing file: {file.filename}")
            
            # Perform OCR
            # PaddleOCR.ocr() returns a list of pages
            result = ocr.ocr(tmp_path, cls=True)  # cls=True enables text direction classification
            
            logger.info(f"OCR result type: {type(result)}, is list: {isinstance(result, list)}")
            if result:
                logger.info(f"Number of pages: {len(result)}")
                if result[0]:
                    logger.info(f"First page has {len(result[0])} detections")
                    # Log first detection structure for debugging
                    if len(result[0]) > 0:
                        logger.info(f"First detection structure: {type(result[0][0])}, length: {len(result[0][0]) if isinstance(result[0][0], (list, tuple)) else 'N/A'}")
                        logger.info(f"First detection sample: {str(result[0][0])[:200]}")
            
            # Extract text and calculate confidence
            all_text_lines = []
            all_confidences = []
            
            if result:
                # result is a list of pages
                for page_idx, page_result in enumerate(result):
                    if not page_result:
                        logger.warning(f"Page {page_idx + 1} has no detections")
                        continue
                    
                    logger.info(f"Processing page {page_idx + 1} with {len(page_result)} detections")
                    
                    # page_result is a list of detections
                    # Each detection: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]], (text, confidence)
                    for det_idx, detection in enumerate(page_result):
                        if not detection:
                            continue
                        
                        try:
                            # Log detection structure for first few detections
                            if det_idx < 3:
                                logger.info(f"Detection {det_idx} type: {type(detection)}, length: {len(detection) if isinstance(detection, (list, tuple)) else 'N/A'}")
                                logger.info(f"Detection {det_idx} content: {detection}")
                            
                            # Handle different detection formats
                            if isinstance(detection, (list, tuple)) and len(detection) >= 2:
                                # Standard format: [[bbox], (text, confidence)]
                                bbox = detection[0]
                                text_info = detection[1]
                            elif isinstance(detection, (list, tuple)) and len(detection) == 1:
                                # Maybe just text_info?
                                bbox = None
                                text_info = detection[0]
                            else:
                                logger.warning(f"Unexpected detection format: {type(detection)}, value: {detection}")
                                continue
                            
                            # Extract text and confidence from text_info
                            if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                                text = str(text_info[0]).strip()
                                confidence = float(text_info[1])
                            elif isinstance(text_info, str):
                                # Fallback: if it's just a string
                                text = text_info.strip()
                                confidence = 0.5
                            else:
                                logger.warning(f"Unexpected text_info format: {type(text_info)}, value: {text_info}")
                                continue
                            
                            # Only add non-empty text
                            if text:
                                # Get Y and X positions for sorting (top to bottom, left to right)
                                y_position = 0
                                x_position = 0
                                if bbox and isinstance(bbox, (list, tuple)) and len(bbox) > 0:
                                    try:
                                        # bbox should be [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                                        if isinstance(bbox[0], (list, tuple)) and len(bbox[0]) >= 2:
                                            y_positions = [point[1] for point in bbox if isinstance(point, (list, tuple)) and len(point) >= 2]
                                            x_positions = [point[0] for point in bbox if isinstance(point, (list, tuple)) and len(point) >= 2]
                                            y_position = min(y_positions) if y_positions else 0
                                            x_position = min(x_positions) if x_positions else 0
                                    except Exception as e:
                                        logger.debug(f"Could not extract position from bbox: {e}")
                                        y_position = 0
                                        x_position = 0
                                
                                all_text_lines.append((y_position, text, x_position))
                                all_confidences.append(confidence)
                                
                                # Log first few extracted texts
                                if len(all_text_lines) <= 5:
                                    logger.info(f"Extracted text #{len(all_text_lines)}: '{text}' (confidence: {confidence:.2f})")
                                
                        except (IndexError, TypeError, ValueError) as e:
                            logger.warning(f"Error parsing detection {det_idx}: {detection}, error: {e}, error type: {type(e)}")
                            import traceback
                            logger.debug(traceback.format_exc())
                            continue
            
            # Sort by Y position (top to bottom), then by X position (left to right)
            all_text_lines.sort(key=lambda x: (x[0], x[2] if len(x) > 2 else 0))
            
            # Extract just the text (without positions)
            text_lines = [line[1] for line in all_text_lines]
            
            # Combine all text with newlines
            full_text = '\n'.join(text_lines) if text_lines else ''
            
            # Calculate average confidence
            avg_confidence = sum(all_confidences) / len(all_confidences) * 100 if all_confidences else 0
            
            logger.info(f"OCR complete. Extracted {len(text_lines)} text segments, avg confidence: {avg_confidence:.2f}%")
            if full_text:
                preview = full_text[:200].replace('\n', ' ')
                logger.info(f"Text preview: {preview}...")
            else:
                logger.warning("No text extracted from image")
            
            return JSONResponse({
                "text": full_text,
                "confidence": round(avg_confidence, 2)
            })
            
        finally:
            # Clean up temporary file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                    logger.debug(f"Cleaned up temp file: {tmp_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {tmp_path}: {e}")
                
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}", exc_info=True)
        # Clean up temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

if __name__ == "__main__":
    # Run on port 3001 to avoid conflict with Node.js server
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info")
