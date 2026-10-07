import cv2
import os
import math

VIDEO_PATH = "videos/accident01.mp4"
OUTPUT_DIR = "timeline_frames"

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

duration = total_frames / fps

print(f"FPS: {fps:.2f}")
print(f"Frames: {total_frames}")
print(f"Duration: {duration:.2f} seconds")
print("")

# Extract one frame every second
time = 0

while time <= duration:

    frame_number = int(time * fps)

    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    ret, frame = cap.read()

    if ret:

        # Add timestamp to image
        text = f"TIME: {time:.1f}s"

        cv2.putText(
            frame,
            text,
            (30, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 255, 255),
            3
        )

        filename = f"time_{time:.1f}s.jpg"

        path = os.path.join(
            OUTPUT_DIR,
            filename
        )

        cv2.imwrite(path, frame)

        print(f"Saved: {path}")

    time += 1.0

cap.release()

print("")
print("Timeline extraction completed.")