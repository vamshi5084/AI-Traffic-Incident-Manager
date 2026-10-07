from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ultralytics import YOLO

import cv2
import os
import shutil
import threading
import time


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="AI Traffic Incident Manager"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# YOLO MODEL
# ============================================================

model = YOLO("yolo11n.pt")


# ============================================================
# VIDEO DIRECTORY
# ============================================================

VIDEO_DIR = "videos"


# ============================================================
# CAMERA CONFIGURATION
# ============================================================

CAMERA_CONFIG = {

    "camera01": {
        "name": "CAMERA 01",
        "location": "Hitech City",
        "source": os.path.join(
            VIDEO_DIR,
            "camera01.mp4"
        )
    },

    "camera02": {
        "name": "CAMERA 02",
        "location": "Madhapur",
        "source": os.path.join(
            VIDEO_DIR,
            "camera02.mp4"
        )
    },

    "camera03": {
        "name": "CAMERA 03",
        "location": "Gachibowli",
        "source": os.path.join(
            VIDEO_DIR,
            "camera03.mp4"
        )
    },

    "camera04": {
        "name": "CAMERA 04",
        "location": "Secunderabad",
        "source": os.path.join(
            VIDEO_DIR,
            "camera04.mp4"
        )
    },

    "camera05": {
        "name": "CAMERA 05",
        "location": "Banjara Hills",
        "source": os.path.join(
            VIDEO_DIR,
            "camera05.mp4"
        )
    }
}


# ============================================================
# VEHICLE CLASSES
# ============================================================

VEHICLE_CLASSES = {
    "car",
    "motorcycle",
    "bus",
    "truck",
    "bicycle"
}


# ============================================================
# CAMERA RESULTS
# ============================================================

camera_results = {}

for camera_id, config in CAMERA_CONFIG.items():

    camera_results[camera_id] = {

        "camera": config["name"],

        "location": config["location"],

        "status": "OFFLINE",

        "vehicles": 0,

        "cars": 0,

        "motorcycles": 0,

        "buses": 0,

        "trucks": 0,

        "bicycles": 0,

        "traffic_level": "LOW",

        "incident_detected": False,

        "incident_type": None,

        "severity": "LOW",

        "source": config["source"],

        "camera_id": camera_id,

        "video_exists": os.path.exists(
            config["source"]
        )
    }


# ============================================================
# CAMERA LOCKS
# ============================================================

camera_locks = {
    camera_id: threading.Lock()
    for camera_id in CAMERA_CONFIG
}


# ============================================================
# LAST PROCESSED FRAMES
# ============================================================

latest_frames = {
    camera_id: None
    for camera_id in CAMERA_CONFIG
}


# ============================================================
# TRAFFIC LEVEL
# ============================================================

def calculate_traffic_level(
    vehicle_count
):

    if vehicle_count <= 5:

        return "LOW"

    elif vehicle_count <= 15:

        return "MEDIUM"

    else:

        return "HIGH"


# ============================================================
# INCIDENT DETECTION
# ============================================================

def determine_incident(
    vehicle_count,
    traffic_level
):

    if traffic_level == "HIGH":

        return {
            "incident_detected": True,
            "incident_type": "Traffic Congestion",
            "severity": "HIGH"
        }

    elif traffic_level == "MEDIUM":

        return {
            "incident_detected": False,
            "incident_type": None,
            "severity": "MEDIUM"
        }

    else:

        return {
            "incident_detected": False,
            "incident_type": None,
            "severity": "LOW"
        }


# ============================================================
# PROCESS ONE FRAME
# ============================================================

def process_cctv_frame(
    frame,
    camera_id
):

    results = model(
        frame,
        verbose=False
    )

    counts = {

        "car": 0,

        "motorcycle": 0,

        "bus": 0,

        "truck": 0,

        "bicycle": 0,

        "person": 0
    }

    annotated_frame = frame.copy()

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            class_name = model.names[
                class_id
            ]

            # Count objects
            if class_name in counts:

                counts[class_name] += 1

            # Bounding box
            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            # Vehicle box
            if class_name in VEHICLE_CLASSES:

                color = (
                    0,
                    255,
                    255
                )

            elif class_name == "person":

                color = (
                    255,
                    255,
                    0
                )

            else:

                color = (
                    255,
                    255,
                    255
                )

            cv2.rectangle(
                annotated_frame,
                (x1, y1),
                (x2, y2),
                color,
                2
            )

            label = (
                f"{class_name} "
                f"{confidence:.2f}"
            )

            cv2.putText(
                annotated_frame,
                label,
                (x1, max(y1 - 8, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2
            )

    # ========================================================
    # VEHICLE TOTAL
    # ========================================================

    vehicle_count = (

        counts["car"]

        + counts["motorcycle"]

        + counts["bus"]

        + counts["truck"]

        + counts["bicycle"]
    )

    # ========================================================
    # TRAFFIC
    # ========================================================

    traffic_level = (
        calculate_traffic_level(
            vehicle_count
        )
    )

    # ========================================================
    # INCIDENT
    # ========================================================

    incident = determine_incident(
        vehicle_count,
        traffic_level
    )

    # ========================================================
    # UPDATE CAMERA DATA
    # ========================================================

    with camera_locks[camera_id]:

        camera_results[camera_id].update({

            "status": "ONLINE",

            "vehicles": vehicle_count,

            "cars": counts["car"],

            "motorcycles":
                counts["motorcycle"],

            "buses":
                counts["bus"],

            "trucks":
                counts["truck"],

            "bicycles":
                counts["bicycle"],

            "person":
                counts["person"],

            "traffic_level":
                traffic_level,

            "incident_detected":
                incident[
                    "incident_detected"
                ],

            "incident_type":
                incident[
                    "incident_type"
                ],

            "severity":
                incident[
                    "severity"
                ]
        })

    # ========================================================
    # DISPLAY INFORMATION
    # ========================================================

    info_lines = [

        f"{CAMERA_CONFIG[camera_id]['name']}",

        f"{CAMERA_CONFIG[camera_id]['location']}",

        f"Vehicles: {vehicle_count}",

        f"Traffic: {traffic_level}"
    ]

    if incident["incident_detected"]:

        info_lines.append(
            f"Incident: "
            f"{incident['incident_type']}"
        )

    y = 30

    for line in info_lines:

        cv2.putText(
            annotated_frame,
            line,
            (15, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2
        )

        y += 30

    return annotated_frame


# ============================================================
# BACKGROUND CAMERA PROCESSOR
# ============================================================

def camera_processor(
    camera_id
):

    config = CAMERA_CONFIG[
        camera_id
    ]

    source = config["source"]

    print(
        f"[{camera_id}] "
        f"Starting processor:"
        f" {source}"
    )

    while True:

        if not os.path.exists(source):

            print(
                f"[{camera_id}] "
                f"Video not found:"
                f" {source}"
            )

            time.sleep(3)

            continue

        cap = cv2.VideoCapture(
            source
        )

        if not cap.isOpened():

            print(
                f"[{camera_id}] "
                f"Unable to open video"
            )

            with camera_locks[
                camera_id
            ]:

                camera_results[
                    camera_id
                ]["status"] = "OFFLINE"

            time.sleep(3)

            continue

        print(
            f"[{camera_id}] "
            f"Video opened successfully"
        )

        with camera_locks[
            camera_id
        ]:

            camera_results[
                camera_id
            ]["status"] = "ONLINE"

        frame_number = 0

        while True:

            success, frame = cap.read()

            if not success:

                print(
                    f"[{camera_id}] "
                    f"Restarting video"
                )

                break

            frame_number += 1

            # Process every 3rd frame
            if frame_number % 3 == 0:

                try:

                    processed_frame = (
                        process_cctv_frame(
                            frame,
                            camera_id
                        )
                    )

                    latest_frames[
                        camera_id
                    ] = processed_frame

                except Exception as error:

                    print(
                        f"[{camera_id}] "
                        f"YOLO error: "
                        f"{error}"
                    )

            # Keep displaying last processed frame
            elif latest_frames[
                camera_id
            ] is not None:

                processed_frame = (
                    latest_frames[
                        camera_id
                    ]
                )

            else:

                processed_frame = frame

            # Small delay
            time.sleep(0.01)

        cap.release()

        time.sleep(0.5)


# ============================================================
# START BACKGROUND PROCESSORS
# ============================================================

@app.on_event("startup")
def start_camera_processors():

    print("")
    print(
        "========================================"
    )

    print(
        " AI TRAFFIC INCIDENT MANAGER"
    )

    print(
        " Starting camera processors..."
    )

    print(
        "========================================"
    )

    for camera_id, config in CAMERA_CONFIG.items():

        source = config["source"]

        print(
            f"{camera_id}: "
            f"{config['location']}"
        )

        print(
            f"Source: {source}"
        )

        print(
            f"Exists: "
            f"{os.path.exists(source)}"
        )

        thread = threading.Thread(
            target=camera_processor,
            args=(camera_id,),
            daemon=True
        )

        thread.start()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message":
            "AI Traffic Incident Manager API is running"
    }


# ============================================================
# GET ALL CAMERAS
# ============================================================

@app.get("/cctv/cameras")
def get_cameras():

    cameras = []

    for camera_id in CAMERA_CONFIG:

        with camera_locks[
            camera_id
        ]:

            data = camera_results[
                camera_id
            ].copy()

        cameras.append(data)

    return {

        "total_cameras":
            len(cameras),

        "cameras":
            cameras
    }


# ============================================================
# GET SINGLE CAMERA STATUS
# ============================================================

@app.get(
    "/cctv/{camera_id}/live"
)
def get_camera_status(
    camera_id: str
):

    if camera_id not in CAMERA_CONFIG:

        return {
            "error":
                "Camera not found"
        }

    with camera_locks[
        camera_id
    ]:

        return camera_results[
            camera_id
        ].copy()


# ============================================================
# LIVE CCTV STREAM
# ============================================================

def generate_cctv_stream(
    camera_id
):

    while True:

        frame = latest_frames[
            camera_id
        ]

        if frame is None:

            # Try to open source
            source = CAMERA_CONFIG[
                camera_id
            ]["source"]

            cap = cv2.VideoCapture(
                source
            )

            success, frame = (
                cap.read()
            )

            cap.release()

            if not success:

                time.sleep(0.2)

                continue

            frame = process_cctv_frame(
                frame,
                camera_id
            )

            latest_frames[
                camera_id
            ] = frame

        success, buffer = cv2.imencode(
            ".jpg",
            frame
        )

        if not success:

            time.sleep(0.05)

            continue

        frame_bytes = (
            buffer.tobytes()
        )

        yield (

            b"--frame\r\n"

            b"Content-Type: "
            b"image/jpeg\r\n\r\n"

            + frame_bytes

            + b"\r\n"
        )

        time.sleep(0.05)


@app.get(
    "/cctv/{camera_id}/stream"
)
def cctv_stream(
    camera_id: str
):

    if camera_id not in CAMERA_CONFIG:

        return {
            "error":
                "Camera not found"
        }

    return StreamingResponse(

        generate_cctv_stream(
            camera_id
        ),

        media_type=
            "multipart/x-mixed-replace; boundary=frame"
    )


# ============================================================
# IMAGE DETECTION
# ============================================================

@app.post("/detect")
async def detect(
    file: UploadFile = File(...)
):

    file_path = "traffic_image.jpg"

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    results = model(
        file_path
    )

    detections = []

    vehicle_count = 0

    for result in results:

        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            class_name = model.names[
                class_id
            ]

            detections.append({

                "object":
                    class_name,

                "confidence":
                    round(
                        confidence,
                        2
                    )
            })

            if class_name in VEHICLE_CLASSES:

                vehicle_count += 1

    traffic_level = (
        calculate_traffic_level(
            vehicle_count
        )
    )

    return {

        "total_vehicles":
            vehicle_count,

        "traffic_level":
            traffic_level,

        "detections":
            detections
    }


# ============================================================
# VIDEO DETECTION
# ============================================================

@app.post("/detect-video")
async def detect_video(
    file: UploadFile = File(...)
):

    file_path = "uploaded_video.mp4"

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    cap = cv2.VideoCapture(
        file_path
    )

    total_frames = 0

    max_vehicle_count = 0

    while True:

        success, frame = (
            cap.read()
        )

        if not success:
            break

        total_frames += 1

        if total_frames % 10 != 0:
            continue

        results = model(
            frame,
            verbose=False
        )

        vehicle_count = 0

        for result in results:

            for box in result.boxes:

                class_id = int(
                    box.cls[0]
                )

                class_name = (
                    model.names[
                        class_id
                    ]
                )

                if (
                    class_name
                    in VEHICLE_CLASSES
                ):

                    vehicle_count += 1

        max_vehicle_count = max(
            max_vehicle_count,
            vehicle_count
        )

    cap.release()

    traffic_level = (
        calculate_traffic_level(
            max_vehicle_count
        )
    )

    return {

        "total_frames":
            total_frames,

        "maximum_vehicles_detected":
            max_vehicle_count,

        "traffic_level":
            traffic_level
    }


# ============================================================
# TRACK VIDEO
# ============================================================

@app.post("/track-video")
async def track_video(
    file: UploadFile = File(...)
):

    file_path = "tracking_video.mp4"

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    results = model.track(
        source=file_path,
        persist=True,
        stream=True,
        verbose=False
    )

    frames_processed = 0

    total_tracks = set()

    for result in results:

        frames_processed += 1

        if result.boxes.id is not None:

            track_ids = (
                result.boxes.id
                .cpu()
                .numpy()
                .tolist()
            )

            for track_id in track_ids:

                total_tracks.add(
                    int(track_id)
                )

    return {

        "frames_processed":
            frames_processed,

        "unique_tracks":
            len(total_tracks)
    }


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )