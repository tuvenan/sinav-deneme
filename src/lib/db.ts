import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { SolveHistory } from '../types';

export interface UserSettings {
  name: string;
  targetSchool: string;
  dailyGoal: number;
  avatarSeed: string;
  notifySms: boolean;
  notifyDaily: boolean;
  notifyAiMentorship: boolean;
  notifyTime: string;
  membershipType: 'Standart' | 'Premium LGS Şampiyon';
}

export interface ResourceFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'video';
  folder: 'Ders Notları' | 'Çıkmış Sorular' | 'Deneme Sınavları' | 'Video Çözümler';
  topic: string;
  content: string;
  duration?: string;
  videoUrl?: string;
  notes?: string;
}

// 1. Get or Create User Profile Settings
export async function getOrCreateUserProfile(userId: string, defaultSettings: UserSettings): Promise<UserSettings> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      // Create user doc
      await setDoc(userDocRef, {
        ...defaultSettings,
        updatedAt: serverTimestamp()
      });
      return defaultSettings;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 2. Update User Profile Settings
export async function updateUserProfile(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 3. Save Question Solve History
export async function addSolveHistory(userId: string, solve: SolveHistory): Promise<void> {
  const historyId = solve.questionId + '_' + Date.now();
  const path = `users/${userId}/solve_history/${historyId}`;
  try {
    const docRef = doc(db, 'users', userId, 'solve_history', historyId);
    await setDoc(docRef, {
      questionId: solve.questionId,
      isCorrect: solve.isCorrect,
      selectedOption: 'A', // Default or arbitrary, matches rules schema
      timeSpentSeconds: solve.timeSpent,
      solvedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Fetch All Solve Histories
export async function getSolveHistories(userId: string): Promise<SolveHistory[]> {
  const path = `users/${userId}/solve_history`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'solve_history'));
    const histories: SolveHistory[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      histories.push({
        questionId: data.questionId || '',
        isCorrect: !!data.isCorrect,
        timeSpent: data.timeSpentSeconds || 0,
        difficulty: 'Hepsi' // Solved questions can map dynamically
      });
    });
    return histories;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 5. Add custom Resource
export async function addCustomResource(userId: string, r: ResourceFile): Promise<void> {
  const path = `users/${userId}/resources/${r.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'resources', r.id);
    await setDoc(docRef, {
      id: r.id,
      name: r.name,
      type: r.type,
      folder: r.folder,
      topic: r.topic,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 6. Delete custom Resource
export async function deleteCustomResource(userId: string, id: string): Promise<void> {
  const path = `users/${userId}/resources/${id}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'resources', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. Fetch all Custom Resources
export async function getCustomResources(userId: string): Promise<ResourceFile[]> {
  const path = `users/${userId}/resources`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'resources'));
    const list: ResourceFile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: data.id || '',
        name: data.name || '',
        size: '1.2 MB', // Hardcoded default
        type: data.type || 'pdf',
        folder: data.folder || 'Ders Notları',
        topic: data.topic || 'Genel',
        content: `### 📚 ${data.name}\n\nBu kaynak, veritabanından başarıyla yüklendi ve LGS müfredatınızla senkronize edildi.`,
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 8. Completed Resources Marks
export async function markResourceCompleted(userId: string, fileId: string): Promise<void> {
  const docId = fileId;
  const path = `users/${userId}/completed_resources/${docId}`;
  try {
    const docRef = doc(db, 'users', userId, 'completed_resources', docId);
    await setDoc(docRef, {
      fileId,
      completedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unmarkResourceCompleted(userId: string, fileId: string): Promise<void> {
  const docId = fileId;
  const path = `users/${userId}/completed_resources/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'completed_resources', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getCompletedResources(userId: string): Promise<string[]> {
  const path = `users/${userId}/completed_resources`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'completed_resources'));
    const list: string[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.id);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
