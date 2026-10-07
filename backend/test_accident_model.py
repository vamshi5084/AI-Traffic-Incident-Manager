import cv2
import numpy as np

VIDEO_PATH = "videos/accident01.mp4"

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open accident video")
    exit()

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)

print("===================================")
print("ACCIDENT VIDEO TEST")
print("===================================")
print(f"FPS: {fps}")
print(f"Total frames: {total_frames}")
print(f"Duration: {total_frames / fps:.2f} seconds")
print("")

previous_gray = None
frame_number = 0

motion_scores = []

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # Convert frame to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Resize for faster processing
    gray = cv2.resize(gray, (640, 360))

    if previous_gray is not None:

        # Calculate frame difference
        difference = cv2.absdiff(previous_gray, gray)

        # Average amount of change
        motion_score = float(np.mean(difference))

        motion_scores.append(
            (frame_number, motion_score)
        )

    previous_gray = gray

cap.release()

# Sort frames by highest motion
motion_scores.sort(
    key=lambda x: x[1],
    reverse=True
)

print("Top motion frames:")
print("-----------------------------------")

for frame, score in motion_scores[:10]:

    time_seconds = frame / fps

    print(
        f"Frame: {frame:4d} | "
        f"Time: {time_seconds:6.2f}s | "
        f"Motion: {score:.2f}"
    )

print("")
print("Video analysis completed.")