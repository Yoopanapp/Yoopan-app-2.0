'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: "Tous les champs sont requis." };
  }

  // 1. Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return { error: "Cet email est déjà utilisé." };
  }

  // 2. Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Créer l'utilisateur
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: null // Pas d'image par défaut pour l'inscription email
      }
    });
    return { success: true };
  } catch (e) {
    return { error: "Erreur lors de la création du compte." };
  }
}