from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import shutil
import tempfile
import os
import cv2

app = FastAPI(title="AI Traffic Incident Manager")

model = YOLO("yolo11n.pt")


@app.get("/")
def home():
    return {
        "message": "AI Traffic Incident Manager API is running"
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".jpg"
    )

    file_path = temp_file.name
    temp_file.close()

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model(file_path)

        detections = []

        vehicle_classes = {
            "car",
            "motorcycle",
            "bus",
            "truck"
        }

        vehicle_count = 0

        for result in results:

            for box in result.boxes:

                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = model.names[class_id]

                detections.append({
                    "object": class_name,
                    "confidence": round(confidence, 2)
                })

                if class_name in vehicle_classes:
                    vehicle_count += 1

        if vehicle_count <= 5:
            traffic_level = "LOW"

        elif vehicle_count <= 15:
            traffic_level = "MEDIUM"

        else:
            traffic_level = "HIGH"

        incident_detected = False
        incident_type = None
        severity = "LOW"

        if traffic_level == "HIGH":
            incident_detected = True
            incident_type = "Traffic Congestion"
            severity = "HIGH"

        return {
            "total_vehicles": vehicle_count,
            "traffic_level": traffic_level,
            "incident_detected": incident_detected,
            "incident_type": incident_type,
            "severity": severity,
            "detections": detections
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)

        await file.close()
@app.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp4"
    )

    file_path = temp_file.name
    temp_file.close()

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        video = cv2.VideoCapture(file_path)

        frame_count = 0
        max_vehicles = 0

        vehicle_classes = {
            "car",
            "motorcycle",
            "bus",
            "truck"
        }

        while True:

            success, frame = video.read()

            if not success:
                break

            frame_count += 1

            # Process every 10th frame
            if frame_count % 10 != 0:
                continue

            results = model(frame)

            vehicle_count = 0

            for result in results:

                for box in result.boxes:

                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]

                    if class_name in vehicle_classes:
                        vehicle_count += 1

            if vehicle_count > max_vehicles:
                max_vehicles = vehicle_count

        video.release()

        # Traffic classification

        if max_vehicles <= 5:
            traffic_level = "LOW"

        elif max_vehicles <= 15:
            traffic_level = "MEDIUM"

        else:
            traffic_level = "HIGH"

        # Incident detection

        incident_detected = False
        incident_type = None
        severity = "LOW"

        if traffic_level == "HIGH":

            incident_detected = True
            incident_type = "Traffic Congestion"
            severity = "HIGH"

        elif traffic_level == "MEDIUM":

            incident_detected = False
            incident_type = None
            severity = "MEDIUM"

        return {
            "frames_processed": frame_count,
            "max_vehicles_in_frame": max_vehicles,
            "traffic_level": traffic_level,
            "incident_detected": incident_detected,
            "incident_type": incident_type,
            "severity": severity
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)

        await file.close()
@app.post("/track-video")
async def track_video(file: UploadFile = File(...)):

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp4"
    )

    file_path = temp_file.name
    temp_file.close()

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        video = cv2.VideoCapture(file_path)

        frame_count = 0
        tracked_vehicles = set()
        max_vehicles = 0

        vehicle_classes = {
            "car",
            "motorcycle",
            "bus",
            "truck"
        }

        while True:

            success, frame = video.read()

            if not success:
                break

            frame_count += 1

            # Process every 10th frame
            if frame_count % 10 != 0:
                continue

            results = model.track(
                frame,
                persist=True,
                verbose=False
            )

            current_vehicle_count = 0

            for result in results:

                if result.boxes.id is None:
                    continue

                for box, track_id in zip(
                    result.boxes,
                    result.boxes.id
                ):

                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]

                    if class_name in vehicle_classes:

                        current_vehicle_count += 1

                        tracked_vehicles.add(
                            int(track_id)
                        )

            if current_vehicle_count > max_vehicles:
                max_vehicles = current_vehicle_count

        video.release()

        if max_vehicles <= 5:
            traffic_level = "LOW"

        elif max_vehicles <= 15:
            traffic_level = "MEDIUM"

        else:
            traffic_level = "HIGH"

        incident_detected = False
        incident_type = None
        severity = "LOW"

        if traffic_level == "HIGH":

            incident_detected = True
            incident_type = "Traffic Congestion"
            severity = "HIGH"

        return {
            "frames_processed": frame_count,
            "max_vehicles_in_frame": max_vehicles,
            "unique_vehicles_tracked": len(tracked_vehicles),
            "traffic_level": traffic_level,
            "incident_detected": incident_detected,
            "incident_type": incident_type,
            "severity": severity
        }

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)

        await file.close()