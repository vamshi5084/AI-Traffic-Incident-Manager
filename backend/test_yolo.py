from ultralytics import YOLO

# Load YOLO model
model = YOLO("yolo11n.pt")

# Run detection on a sample image from the internet
results = model("https://ultralytics.com/images/bus.jpg")

# Display results
for result in results:
    result.show()

print("YOLO detection completed successfully!")