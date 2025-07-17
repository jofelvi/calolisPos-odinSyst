import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/services/firebase/firebase';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, `${path}/${uuidv4()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadAttendancePhoto = async (photoBlob: Blob, employeeId: string): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `attendance_${employeeId}_${timestamp}.jpg`;
  const storageRef = ref(storage, `attendance/${fileName}`);
  const snapshot = await uploadBytes(storageRef, photoBlob);
  return getDownloadURL(snapshot.ref);
};
