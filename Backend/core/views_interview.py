from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import InterviewVideo

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_latest_user_interview_video(request):
    user = request.user

    video = (
        InterviewVideo.objects
        .filter(session__user=user)
        .order_by("-uploaded_at")
        .first()
    )

    if not video:
        return Response({"has_video": False}, status=200)

    video_url = request.build_absolute_uri(video.video.url)

    return Response({
        "has_video": True,
        "video_id": video.id,
        "video_url": video_url,
        "question": video.question.text if video.question else None,
        "uploaded_at": video.uploaded_at,
        "feedback": video.feedback,  # لو كان اتحلل قبل كده
    }, status=200)