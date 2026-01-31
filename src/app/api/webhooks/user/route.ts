import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { User } from '@/src/lib/models';
import { connectToDatabase } from '@/src/lib/mongo';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

// Tipos para o evento do Clerk
interface ClerkWebhookEvent {
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: {
      id: string;
      email_address: string;
    }[];
    primary_email_address_id: string;
    image_url: string | null;
    [key: string]: any;
  };
  object: string;
  type: string;
}

export async function POST(request: Request) {
  // Conecta ao MongoDB
  await connectToDatabase();

  // Obtém os headers
  const headersList = await headers();
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  // Verifica se temos o secret
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET não está configurado');
    return NextResponse.json(
      { message: 'Webhook secret não configurado' },
      { status: 500 }
    );
  }

  // Verifica os headers necessários
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error(' Headers do webhook ausentes');
    return NextResponse.json(
      { message: 'Headers do webhook ausentes' },
      { status: 400 }
    );
  }

  // Obtém o payload
  const payload = await request.json();
  
  // Cria a instância do webhook
  const wh = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    // Verifica a assinatura usando o método correto
    event = wh.verify(
      JSON.stringify(payload),
      {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }
    ) as ClerkWebhookEvent;
  } catch (err) {
    console.error(' Verificação da assinatura do webhook falhou:', err);
    return NextResponse.json(
      { message: 'Assinatura inválida' },
      { status: 400 }
    );
  }

  const eventType = event.type;
  console.log(` Webhook recebido: ${eventType}`);

  // Processa os eventos
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      primary_email_address_id,
      image_url,
    } = event.data;

    // Encontra o email primário
    const primaryEmail = email_addresses.find(
      (email) => email.id === primary_email_address_id
    );

    const email = primaryEmail?.email_address || email_addresses[0]?.email_address || '';
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      // Usa findOneAndUpdate com upsert para criar ou atualizar
      const mongoUser = await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email: email.toLowerCase().trim(),
          name: name || email.split('@')[0], // Usa parte do email se nome não existir
          profileImage: image_url || '',
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`✅ Usuário ${eventType === 'user.created' ? 'criado' : 'atualizado'}:`, mongoUser.email);
    } catch (error) {
      console.error(' Erro ao processar usuário:', error);
      return NextResponse.json(
        { message: 'Erro ao processar usuário no banco de dados' },
        { status: 500 }
      );
    }
  } else if (eventType === 'user.deleted') {
    const { id } = event.data;
    
    try {
      // Remove o usuário do MongoDB quando deletado no Clerk
      const result = await User.deleteOne({ clerkId: id });
      
      if (result.deletedCount > 0) {
        console.log(` Usuário deletado do MongoDB: ${id}`);
      } else {
        console.log(` Usuário não encontrado para deletar: ${id}`);
      }
    } catch (error) {
      console.error(' Erro ao deletar usuário:', error);
      return NextResponse.json(
        { message: 'Erro ao deletar usuário do banco de dados' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { message: 'Webhook processado com sucesso' },
    { status: 200 }
  );
}

// Método GET para teste (opcional)
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Webhook endpoint está funcionando',
      instructions: 'Configure este endpoint no Clerk Dashboard -> Webhooks'
    },
    { status: 200 }
  );
}