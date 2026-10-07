from ultralytics import YOLO
import cv2
import math

VIDEO_PATH = "videos/accident01.mp4"

model = YOLO("yolo11n.pt")

cap = cv2.VideoCapture(VIDEO_PATH)

fps = cap.get(cv2.CAP_PROP_FPS)

print("FPS:", fps)

frame_number = 0
previous_gray = None
previous_centers = {}

records = []

while True:

    success, frame = cap.read()

    if not success:
        break

    frame_number += 1

    if frame_number % 3 != 0:
        continue

    # -----------------------------
    # Frame change
    # -----------------------------

    gray = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2GRAY
    )

    gray = cv2.resize(
        gray,
        (640, 360)
    )

    frame_change = 0

    if previous_gray is not None:

        difference = cv2.absdiff(
            gray,
            previous_gray
        )

        frame_change = float(
            difference.mean()
        )

    previous_gray = gray

    # -----------------------------
    # YOLO tracking
    # -----------------------------

    results = model.track(
        frame,
        persist=True,
        verbose=False
    )

    current_centers = {}

    vehicle_count = 0

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(box.cls[0])

            class_name = model.names[class_id]

            if class_name not in [
                "car",
                "truck",
                "bus",
                "motorcycle"
            ]:
                continue

            vehicle_count += 1

            if box.id is None:
                continue

            track_id = int(box.id[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2

            current_centers[track_id] = (
                center_x,
                center_y
            )

    # -----------------------------
    # Vehicle movement
    # -----------------------------

    maximum_motion = 0
    motion_vehicle = None

    for track_id, (new_x, new_y) in current_centers.items():

        if track_id not in previous_centers:
            continue

        old_x, old_y = previous_centers[track_id]

        movement = math.sqrt(
            (new_x - old_x) ** 2 +
            (new_y - old_y) ** 2
        )

        if movement > maximum_motion:

            maximum_motion = movement
            motion_vehicle = track_id

    previous_centers = current_centers

    records.append({
        "frame": frame_number,
        "vehicles": vehicle_count,
        "motion": maximum_motion,
        "frame_change": frame_change
    })


cap.release()

# -----------------------------------------
# Show frames with highest vehicle movement
# -----------------------------------------

print()
print("TOP VEHICLE MOVEMENT FRAMES")
print("========================================")

top_motion = sorted(
    records,
    key=lambda x: x["motion"],
    reverse=True
)[:10]

for item in top_motion:

    print(
        f"Frame {item['frame']:3d} | "
        f"vehicles={item['vehicles']} | "
        f"motion={item['motion']:.2f} | "
        f"change={item['frame_change']:.2f}"
    )

# -----------------------------------------
# Show frames with highest visual change
# -----------------------------------------

print()
print("TOP FRAME CHANGE FRAMES")
print("========================================")

top_change = sorted(
    records,
    key=lambda x: x["frame_change"],
    reverse=True
)[:10]

for item in top_change:

    print(
        f"Frame {item['frame']:3d} | "
        f"vehicles={item['vehicles']} | "
        f"motion={item['motion']:.2f} | "
        f"change={item['frame_change']:.2f}"
    )

print()
print("========================================")