// services/firebase/auth.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { loginSchema, registerSchema } from '@/shared/schemas/userSchema';
import * as yup from 'yup';
import { auth, db } from '@/services/firebase/firebase';
import { User } from '@/modelTypes/user';
import { UserRoleEnum } from '@/shared';

// Tipos inferidos de los esquemas para los argumentos de las funciones
export type LoginInput = yup.InferType<typeof loginSchema>;
export type RegisterInput = yup.InferType<typeof registerSchema>;

// Función de Registro
export const signUpWithEmail = async ({
  name,
  email,
  password,
}: RegisterInput): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const { user } = userCredential;

    // Prepara los datos del usuario para Firestore
    const newUser: User = {
      id: user.uid,
      name,
      email: user.email!,
      image: `https://i.pravatar.cc/150?u=${user.uid}`, // Placeholder image
      role: UserRoleEnum.CUSTOMER,
      isActive: true,
    };

    // Guarda el usuario en la colección 'users' de Firestore
    await setDoc(doc(db, 'users', user.uid), newUser);

    return userCredential;
  } catch (error) {
    // Re-throw error to be handled by calling component
    throw error;
  }
};

// Función de Login
export const signInWithEmail = async ({
  email,
  password,
}: LoginInput): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential;
  } catch (error) {
    // Re-throw error to be handled by calling component
    throw error;
  }
};
