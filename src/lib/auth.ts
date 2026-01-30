
import { currentUser } from '@clerk/nextjs/server';
import { User } from './models';

/**
 * Sincroniza o usuário do Clerk com o MongoDB
 * Chame esta função sempre que um usuário fizer login
 */
export async function syncClerkUserWithDatabase() {
  const user = await currentUser();
  
  if (!user) {
    return null;
  }

  try {
    const email = user.emailAddresses[0]?.emailAddress || '';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const image = user.imageUrl || '';

    // Busca ou cria o usuário no MongoDB
    const mongoUser = await User.findOneAndUpdate(
      { clerkId: user.id },
      {
        clerkId: user.id,
        email: email,
        name: name,
        profileImage: image,
      },
      { 
        upsert: true, // Cria se não existir
        new: true, // Retorna o documento atualizado
        setDefaultsOnInsert: true,
      }
    );

    return mongoUser;
  } catch (error) {
    console.error('Erro ao sincronizar usuário Clerk com MongoDB:', error);
    return null;
  }
}

/**
 * Obtém o usuário atual do MongoDB baseado na sessão do Clerk
 */
export async function getCurrentUser() {
  const user = await currentUser();
  
  if (!user) {
    return null;
  }

  try {
    const mongoUser = await User.findOne({ clerkId: user.id });
    return mongoUser;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}