FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy project files into container
COPY . .

# Create folders for uploads and database (in case they don't exist in repo)
RUN mkdir -p uploads db

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the Flask default port
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]
