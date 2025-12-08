import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename


def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def save_uploaded_file(file, upload_folder, allowed_extensions):
    if file and allowed_file(file.filename, allowed_extensions):
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{filename}"

        # Save file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)

        return unique_filename
    return None
