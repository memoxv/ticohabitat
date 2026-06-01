'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    category: 'Publicar y Gestionar',
    questions: [
      {
        q: '¿Cómo publico una propiedad en TicoHabitat?',
        a: 'Ingresá a tu cuenta, hacé clic en "Publicar" desde el menú principal y completá el formulario con los datos de tu propiedad: tipo (venta o alquiler), ubicación, precio, fotos y datos de contacto. Tu anuncio estará activo de inmediato.',
      },
      {
        q: '¿Cuánto cuesta publicar un anuncio?',
        a: 'Publicar un anuncio básico en TicoHabitat es completamente gratuito. Solo cobramos si decidís destacar tu anuncio para que aparezca en las secciones premium de la plataforma.',
      },
      {
        q: '¿Cuánto tiempo dura mi anuncio activo?',
        a: 'Los anuncios tienen una vigencia de 30 días. Al vencerse, se marcan automáticamente como expirados. Podés renovarlos desde tu panel de control en cualquier momento.',
      },
      {
        q: '¿Puedo editar mi anuncio después de publicarlo?',
        a: 'Sí. Desde tu panel de control (Dashboard) podés editar el título, descripción, precio, fotos y cualquier detalle de tu propiedad en cualquier momento mientras el anuncio esté activo.',
      },
      {
        q: '¿Cuántas fotos puedo subir por anuncio?',
        a: 'Podés subir varias fotos por anuncio. Recomendamos incluir al menos 3 fotos de buena calidad que muestren los espacios principales de la propiedad.',
      },
    ],
  },
  {
    category: 'Verificación y Seguridad',
    questions: [
      {
        q: '¿Por qué me piden verificar mi correo electrónico?',
        a: 'La verificación por correo electrónico (mediante enlace seguro o código OTP de 6 dígitos) es obligatoria antes de publicar. Esto garantiza que cada anuncio tiene un propietario real detrás, elimina el spam y protege a compradores e inquilinos de anuncios falsos.',
      },
      {
        q: '¿Qué pasa si no recibo el correo de verificación?',
        a: 'Verificá tu carpeta de spam o correo no deseado. Asegurate de que el correo registrado sea el correcto. Podés solicitar un reenvío del enlace o del código OTP desde la pantalla de publicación. Si el problema persiste, contactanos por WhatsApp para ayudarte.',
      },
      {
        q: '¿Es seguro compartir mi número de teléfono?',
        a: 'Tu número de contacto solo se muestra en tu anuncio para que los interesados puedan comunicarse directamente con vos. No compartimos tus datos con terceros ni los usamos para publicidad.',
      },
      {
        q: '¿Cómo previenen los anuncios duplicados?',
        a: 'Nuestro sistema detecta automáticamente anuncios duplicados o sospechosos mediante filtros de calidad. Si un anuncio se identifica como duplicado, se notifica al propietario para que tome acción.',
      },
    ],
  },
  {
    category: 'Anuncios Destacados',
    questions: [
      {
        q: '¿Qué es un anuncio destacado?',
        a: 'Un anuncio destacado aparece en las secciones "Recomendados Premium" al inicio de la página de compra o alquiler. Esto le da mucha más visibilidad a tu propiedad frente a miles de visitantes.',
      },
      {
        q: '¿Cuánto cuesta destacar un anuncio?',
        a: 'Los precios de destacado varían según el plan que elijás. Podés ver las opciones disponibles desde tu panel de control en la sección "Destacar". Actualmente ofrecemos tarifas accesibles para propietarios individuales.',
      },
      {
        q: '¿Cuánto dura el destacado?',
        a: 'La duración depende del plan seleccionado. Generalmente va desde 7 hasta 30 días. Una vez vencido, tu anuncio sigue activo pero vuelve a la lista regular.',
      },
    ],
  },
  {
    category: 'Buscar Propiedades',
    questions: [
      {
        q: '¿Cómo busco propiedades?',
        a: 'Podés navegar por provincia desde las secciones "Comprar" o "Alquilar". Cada provincia muestra los anuncios activos con filtros por tipo de propiedad, precio y características.',
      },
      {
        q: '¿Puedo guardar propiedades como favoritas?',
        a: 'Sí. Si tenés una cuenta activa, podés marcar propiedades como favoritas haciendo clic en el ícono de corazón. Las encontrás después en tu panel de control.',
      },
      {
        q: '¿Cómo contacto al propietario?',
        a: 'Cada anuncio incluye un botón de contacto directo por WhatsApp o teléfono. La comunicación es siempre directa entre vos y el propietario, sin intermediarios ni comisiones.',
      },
    ],
  },
  {
    category: 'Cuenta y Soporte',
    questions: [
      {
        q: '¿Necesito una cuenta para buscar propiedades?',
        a: 'No. Podés navegar y ver todos los anuncios sin registrarte. Solo necesitás crear una cuenta si querés publicar un anuncio, guardar favoritos o destacar propiedades.',
      },
      {
        q: '¿Cómo recupero mi contraseña?',
        a: 'En la pantalla de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?". Te enviaremos un enlace de recuperación al correo electrónico registrado.',
      },
      {
        q: '¿Cómo contacto al equipo de soporte?',
        a: 'Podés escribirnos directamente por WhatsApp al +506 6067-7055. Nuestro equipo atiende consultas de lunes a sábado en horario de Costa Rica.',
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-stone-200/50 dark:border-stone-850/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-stone-800 dark:text-stone-100 group-hover:text-primary transition-colors leading-snug">
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pl-0.5 pr-8">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-stone-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">Preguntas Frecuentes</span>
        </div>

        {/* Header */}
        <div className="text-left mb-14 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
            Preguntas <span className="text-primary">Frecuentes</span>
          </h1>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
            Respuestas a las dudas más comunes sobre cómo publicar, buscar y destacar propiedades en TicoHabitat.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {FAQ_ITEMS.map((section) => (
            <div key={section.category}>
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/15" />
                <span>{section.category}</span>
                <span className="h-px flex-1 bg-primary/15" />
              </h2>

              <div className="rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-white dark:bg-stone-900/60 px-6">
                {section.questions.map((item) => (
                  <FAQItem
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl border border-stone-200/50 dark:border-stone-850 bg-white dark:bg-stone-900/40 text-center space-y-4">
          <h3 className="font-display font-extrabold text-lg text-stone-900 dark:text-white">
            ¿No encontraste la respuesta que buscabas?
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Nuestro equipo de soporte está listo para ayudarte. Escribinos directamente por WhatsApp y te respondemos lo antes posible.
          </p>
          <a
            href="https://wa.me/50660677055"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-6 text-xs font-black text-white bg-[#25D366] hover:bg-[#1da851] rounded-xl shadow-md hover-lift transition-all active:scale-[0.985]"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Escribir por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
