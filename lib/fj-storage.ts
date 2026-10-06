import { supabaseAdmin } from "@/lib/supabase/admin";
import { signedMediaUrl } from "@/lib/course-media";
import { downloadFiles, storageFolder, type FjCourse, type FjLesson } from "@/lib/following-jesus";

// Signed URLs for a course's recordings and PDFs. Both buckets are private;
// these are the only way to their files, and every caller has already checked
// the purchase (learnerWithAccess) before asking.

export const DOWNLOADS_BUCKET = "course-downloads";

/** A minute is plenty: the URL is used by the redirect straight away. */
const DOWNLOAD_URL_SECONDS = 60;

/** The lesson's recording: course-media/audio/following-jesus-<course>/lesson-NN.mp3. */
export function signedLessonAudio(course: FjCourse, lesson: FjLesson): Promise<string | null> {
  return signedMediaUrl("audio", `${lesson.slug}.mp3`, storageFolder(course));
}

/** A course PDF, or null if `file` is not one of the course's downloads. */
export async function signedDownload(course: FjCourse, file: string): Promise<string | null> {
  if (!downloadFiles(course).includes(file)) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(DOWNLOADS_BUCKET)
    .createSignedUrl(`${storageFolder(course)}/${file}`, DOWNLOAD_URL_SECONDS, {
      // Saved as, for example, following-jesus-begin-chapter-01.pdf.
      download: `${storageFolder(course)}-${file}`,
    });
  if (error) {
    console.error(`Could not sign ${file} for ${course.key}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
