import cv2
import os

VIDEO_PATH = "videos/accident01.mp4"
OUTPUT_DIR = "accident_frames"

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

fps = cap.get(cv2.CAP_PROP_FPS)

# Around the detected event
center_frame = 240

frames_to_extract = [
    center_frame - 15,
    center_frame - 10,
    center_frame - 5,
    center_frame,
    center_frame + 5,
    center_frame + 10,
    center_frame + 15
]

for frame_number in frames_to_extract:

    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    ret, frame = cap.read()

    if not ret:
        continue

    time_seconds = frame_number / fps

    filename = (
        f"frame_{frame_number}_"
        f"{time_seconds:.2f}s.jpg"
    )

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    cv2.imwrite(path, frame)

    print(f"Saved: {path}")

cap.release()

print("")
print("Frame extraction completed.")