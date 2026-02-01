Interview System
Relevant source files
Backend/backend/settings.py
Backend/core/admin.py
Backend/core/migrations/0001_initial.py
Purpose and Scope
This document describes the video-based interview system in Careery, which enables job seekers to record and submit video responses to pre-defined interview questions. The system manages interview sessions, question sets, and video recordings with feedback capabilities.

For information about the job application process and application lifecycle, see Job System. For CV management and profile data, see CV & Resume Management.

Sources: 
Backend/core/migrations/0001_initial.py
17-187
 
Backend/core/admin.py
268-294

System Overview
The Interview System comprises three core models that work together to facilitate asynchronous video interviews:

Model	Purpose	Key Relationships
InterviewQuestion	Stores pre-defined interview questions with optional categorization	Standalone, referenced by InterviewVideo
InterviewSession	Represents a single interview session for a user	Belongs to User, contains multiple InterviewVideo records
InterviewVideo	Links video recordings to sessions and questions	Belongs to InterviewSession, optionally references InterviewQuestion
The system supports both structured interviews (where videos answer specific questions) and unstructured interviews (where videos are not linked to specific questions).

Sources: 
Backend/core/migrations/0001_initial.py
17-187

Data Model
Entity Relationship Diagram

























































Sources: 
Backend/core/migrations/0001_initial.py
17-187

Model Details
InterviewQuestion
Defined in 
Backend/core/migrations/0001_initial.py
17-24
 the InterviewQuestion model stores reusable interview questions:

text (CharField, max_length=500): The question text
category (CharField, max_length=50, optional): Question categorization (e.g., "technical", "behavioral")
Questions are created by administrators and can be reused across multiple interview sessions.

InterviewSession
Defined in 
Backend/core/migrations/0001_initial.py
169-176
 the InterviewSession model tracks individual interview sessions:

user (ForeignKey to User): The job seeker conducting the interview
started_at (DateTimeField, auto_now_add=True): Session creation timestamp
ended_at (DateTimeField, nullable): Session completion timestamp
A session is automatically created when a user begins an interview and remains open until explicitly ended.

InterviewVideo
Defined in 
Backend/core/migrations/0001_initial.py
178-187
 the InterviewVideo model stores video recordings:

session (ForeignKey to InterviewSession, related_name='videos'): Parent session
question (ForeignKey to InterviewQuestion, nullable, on_delete=SET_NULL): Associated question (if any)
video (FileField, upload_to='interview_videos/'): Video file
uploaded_at (DateTimeField, auto_now_add=True): Upload timestamp
feedback (TextField, nullable): Reviewer feedback/notes
Videos are stored in the media/interview_videos/ directory as configured in 
Backend/backend/settings.py
132-135

Sources: 
Backend/core/migrations/0001_initial.py
17-187
 
Backend/backend/settings.py
132-135

Interview Workflow
Session Lifecycle
















Sources: 
Backend/core/migrations/0001_initial.py
169-187

Video Upload and Storage















Sources: 
Backend/core/migrations/0001_initial.py
178-187
 
Backend/backend/settings.py
132-135

Question Management
Question Bank Structure
The InterviewQuestion model serves as a centralized question bank. Questions can be categorized for different interview types:

Technical: Programming, algorithm, system design questions
Behavioral: Situational, experience-based questions
Domain-specific: Industry or role-specific questions
Custom categories: User-defined categories
Questions are managed through the Django admin interface defined in 
Backend/core/admin.py
271-274
:

@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "category")
    search_fields = ("text", "category")
Administrators can create, edit, and categorize questions, making them available for all interview sessions.

Sources: 
Backend/core/admin.py
271-274
 
Backend/core/migrations/0001_initial.py
17-24

Session Management
Creating and Managing Sessions
Interview sessions are created when a user begins an interview. The InterviewSession model automatically records:

Session start time: started_at field with auto_now_add=True
User association: Links to the job seeker's User record
Video collection: Accessible via the videos related manager
Admin Interface for Sessions
Defined in 
Backend/core/admin.py
280-284
 the InterviewSessionAdmin provides:

List display: Session ID, user email, start time, end time
Search: By user email via user__email
Filtering: By started_at timestamp
Session States
State	Characteristics	ended_at Value
Active	Session in progress, user can upload videos	null
Completed	Session finished, no more videos can be added	Timestamp of completion
Sources: 
Backend/core/admin.py
280-284
 
Backend/core/migrations/0001_initial.py
169-176

Video Recording and Storage
Video Model Architecture
Each InterviewVideo record represents a single video recording within a session. The model supports:

Question linking: Optional ForeignKey to InterviewQuestion with on_delete=SET_NULL
File storage: Videos stored as FileField in interview_videos/ directory
Metadata tracking: Upload timestamp and session association
Feedback mechanism: Text field for reviewer comments
File Storage Configuration
Videos are stored according to the media configuration in 
Backend/backend/settings.py
132-135
:

MEDIA_URL: /media/
MEDIA_ROOT: BASE_DIR / "media"
Upload path: interview_videos/ (relative to MEDIA_ROOT)
Full path: <BASE_DIR>/media/interview_videos/<filename>

Video Processing Capabilities
The Docker configuration includes ffmpeg for multimedia processing (
Backend/Dockerfile
), enabling potential features:

Video format conversion
Thumbnail generation
Compression and optimization
Metadata extraction
Sources: 
Backend/core/migrations/0001_initial.py
178-187
 
Backend/backend/settings.py
132-135
 
Backend/Dockerfile

Admin Interface
Video Management Interface
The InterviewVideoAdmin class in 
Backend/core/admin.py
290-294
 provides comprehensive video management:

@admin.register(InterviewVideo)
class InterviewVideoAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "question", "uploaded_at", "video")
    search_fields = ("session__user__email",)
    list_filter = ("uploaded_at",)
Features:

List view: Shows video ID, session, question, upload time, and video file
Search: Find videos by the user's email (via session relationship)
Filtering: Filter by upload date
Direct access: Click-through to video files and related objects
Review Workflow
Sources: 
Backend/core/admin.py
268-294

Data Access Patterns
Retrieving Videos for a Session
Access all videos in a session using the videos related manager:

# Through InterviewSession instance
session.videos.all()  # Returns QuerySet of InterviewVideo objects
Defined in 
Backend/core/migrations/0001_initial.py
185
 as related_name='videos'.

Querying by Question Category
Find all videos answering questions in a specific category:

# Filter through question relationship
InterviewVideo.objects.filter(
    question__category="technical"
).select_related('session', 'question')
Finding User's Interview History
Retrieve all interview sessions for a user:

# User to sessions (one-to-many)
user.interviewsession_set.all()

# Include videos
sessions = user.interviewsession_set.prefetch_related('videos')
Sources: 
Backend/core/migrations/0001_initial.py
169-187

Integration Points
Connection to User System
Interview sessions are always associated with a User via ForeignKey relationship
Only job seekers typically create interview sessions (user_type='job_seeker')
User deletion cascades to interview sessions and videos (default CASCADE behavior)
See User Management for details on user types and authentication.

Media Storage Integration
Videos use Django's FileField with upload_to='interview_videos/'
Files are served through the media URL pattern configured in 
Backend/backend/settings.py
132
Storage location: MEDIA_ROOT/interview_videos/
For deployment considerations regarding media file serving, see Deployment.

Potential Job Application Integration
While the current data model doesn't explicitly link interviews to job applications, the system is designed to support:

Pre-screening video interviews before application review
Portfolio-style video responses shared across multiple applications
Integration with the JobApplication model for structured hiring workflows
See Job System for application lifecycle details.

Sources: 
Backend/core/migrations/0001_initial.py
169-187
 
Backend/backend/settings.py
132-135

Key Implementation Files
File	Purpose
Backend/core/migrations/0001_initial.py
17-187
Database schema definition for interview models
Backend/core/admin.py
268-294
Django admin interface configuration
Backend/backend/settings.py
132-135
Media storage configuration
Backend/Dockerfile
Includes ffmpeg for video processing capabilities
Sources: All files listed in table above
