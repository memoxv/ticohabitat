import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | TicoHabitat',
  description: 'Términos y condiciones de uso de la plataforma TicoHabitat para la publicación y búsqueda de propiedades en Costa Rica.',
  alternates: {
    canonical: '/terminos',
  },
};

export default function TerminosPage() {
  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-stone-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">Términos y Condiciones</span>
        </div>

        {/* Header */}
        <div className="text-left mb-14 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
            Términos y <span className="text-primary">Condiciones</span>
          </h1>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
            Última actualización: 31 de mayo de 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose-container space-y-10">

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              1. Aceptación de los Términos
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Al acceder y utilizar la plataforma TicoHabitat (en adelante &ldquo;la Plataforma&rdquo;), operada bajo el dominio ticohabitat.com, usted acepta quedar vinculado por estos Términos y Condiciones de uso. Si no está de acuerdo con alguno de estos términos, le solicitamos que se abstenga de utilizar la Plataforma.
              </p>
              <p>
                TicoHabitat se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigencia al ser publicadas en esta página. El uso continuado de la Plataforma después de dichas modificaciones constituye su aceptación de los términos actualizados.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              2. Descripción del Servicio
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                TicoHabitat es una plataforma digital de clasificados inmobiliarios enfocada exclusivamente en Costa Rica. Permite a los usuarios publicar anuncios de propiedades en venta y alquiler, así como buscar y contactar directamente a propietarios de inmuebles.
              </p>
              <p>
                La Plataforma actúa únicamente como intermediario tecnológico. TicoHabitat no es una inmobiliaria, no participa en las transacciones de compraventa o alquiler, no cobra comisiones sobre dichas transacciones y no garantiza la concreción de ningún negocio entre las partes.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              3. Registro y Verificación de Identidad
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Para publicar anuncios, los usuarios deben crear una cuenta proporcionando un correo electrónico válido y una contraseña segura. Adicionalmente, la Plataforma requiere la verificación obligatoria de la dirección de correo electrónico mediante un enlace seguro o código OTP enviado a su bandeja de entrada.
              </p>
              <p>
                Esta verificación tiene como objetivo:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Confirmar la legitimidad del anunciante.</li>
                <li>Prevenir la publicación de anuncios spam o fraudulentos.</li>
                <li>Garantizar un entorno de transacciones seguro y confiable.</li>
              </ul>
              <p>
                El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier actividad realizada desde su cuenta será considerada como realizada por el titular.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              4. Publicación de Anuncios
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Al publicar un anuncio en TicoHabitat, el usuario declara y garantiza que:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Es el propietario legítimo de la propiedad o tiene autorización expresa para publicarla.</li>
                <li>La información proporcionada (precio, ubicación, características, fotos) es veraz y precisa.</li>
                <li>Las fotografías son reales y corresponden a la propiedad anunciada.</li>
                <li>La propiedad se encuentra disponible para la transacción indicada (venta o alquiler).</li>
              </ul>
              <p>
                Los anuncios básicos son gratuitos y tienen una vigencia de 30 días calendario. Tras este período, el anuncio se marcará como expirado automáticamente. El usuario podrá renovarlo desde su panel de control.
              </p>
              <p>
                TicoHabitat se reserva el derecho de eliminar, sin previo aviso, anuncios que contengan información falsa, duplicada, ofensiva, que infrinjan derechos de terceros o que no correspondan a propiedades inmobiliarias.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              5. Anuncios Destacados y Pagos
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                TicoHabitat ofrece la opción de destacar anuncios mediante un servicio de pago. Los anuncios destacados reciben mayor visibilidad al aparecer en las secciones premium de la Plataforma (&ldquo;Recomendados Premium&rdquo;).
              </p>
              <p>
                Los precios, duración y condiciones de los planes de destacado se indican al momento de la contratación. Una vez realizado el pago, el servicio de destacado no es reembolsable, salvo que TicoHabitat determine lo contrario a su discreción.
              </p>
              <p>
                El destacado de un anuncio no implica aprobación, respaldo ni verificación adicional del contenido del anuncio por parte de TicoHabitat.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              6. Conducta del Usuario
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Los usuarios se comprometen a:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>No publicar contenido falso, engañoso, difamatorio u ofensivo.</li>
                <li>No utilizar la Plataforma para actividades ilegales o contrarias a la legislación costarricense.</li>
                <li>No publicar el mismo anuncio más de una vez de forma simultánea.</li>
                <li>No intentar eludir los sistemas de verificación o seguridad de la Plataforma.</li>
                <li>No utilizar sistemas automatizados (bots, scrapers) para acceder o extraer datos de la Plataforma.</li>
                <li>Respetar a otros usuarios en toda comunicación derivada de la Plataforma.</li>
              </ul>
              <p>
                El incumplimiento de estas normas podrá resultar en la suspensión temporal o permanente de la cuenta del usuario, así como en la eliminación de sus anuncios.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              7. Protección de Datos Personales
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                TicoHabitat recopila y procesa datos personales necesarios para la operación del servicio, incluyendo: nombre, correo electrónico, número de celular y datos de las propiedades publicadas.
              </p>
              <p>
                Estos datos se utilizan exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Gestionar la cuenta del usuario y sus anuncios.</li>
                <li>Facilitar el contacto entre compradores/inquilinos y propietarios.</li>
                <li>Enviar notificaciones relacionadas con el servicio.</li>
                <li>Prevenir fraudes y garantizar la seguridad de la Plataforma.</li>
              </ul>
              <p>
                TicoHabitat no vende, alquila ni comparte datos personales con terceros para fines publicitarios. Los datos se almacenan en servidores seguros con cifrado y acceso controlado, en cumplimiento con la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968 de Costa Rica).
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              8. Limitación de Responsabilidad
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                TicoHabitat no se hace responsable de:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>La veracidad, exactitud o legalidad de la información publicada por los usuarios.</li>
                <li>La calidad, estado o condición real de las propiedades anunciadas.</li>
                <li>Las negociaciones, acuerdos o transacciones realizadas entre usuarios fuera de la Plataforma.</li>
                <li>Daños directos o indirectos derivados del uso de la Plataforma.</li>
                <li>Interrupciones temporales del servicio por mantenimiento o causas de fuerza mayor.</li>
              </ul>
              <p>
                Se recomienda a los usuarios verificar de forma independiente la información de las propiedades antes de tomar cualquier decisión de compra o alquiler. TicoHabitat aconseja realizar visitas presenciales y consultar con profesionales legales antes de formalizar transacciones inmobiliarias.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              9. Propiedad Intelectual
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Todo el contenido de la Plataforma, incluyendo pero no limitado a diseño, código, logotipos, textos, gráficos e interfaces, es propiedad de TicoHabitat y/o de sus desarrolladores (SoutLabs) y está protegido por las leyes de propiedad intelectual aplicables.
              </p>
              <p>
                Al publicar contenido (fotos, textos, descripciones) en la Plataforma, el usuario otorga a TicoHabitat una licencia no exclusiva, mundial y gratuita para mostrar, reproducir y distribuir dicho contenido exclusivamente dentro de la Plataforma y sus canales de promoción.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              10. Legislación Aplicable y Jurisdicción
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Estos Términos y Condiciones se rigen por las leyes de la República de Costa Rica. Para cualquier controversia derivada del uso de la Plataforma, las partes se someten a la jurisdicción de los tribunales competentes de San José, Costa Rica.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
              11. Contacto
            </h2>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
              <p>
                Para cualquier consulta, reclamo o solicitud relacionada con estos Términos y Condiciones, puede contactarnos a través de:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">WhatsApp:</strong>{' '}
                  <a href="https://wa.me/50660677055" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    +506 6067-7055
                  </a>
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Plataforma:</strong>{' '}
                  <Link href="/" className="text-primary hover:underline">
                    ticohabitat.com
                  </Link>
                </li>
              </ul>
            </div>
          </section>

        </div>

        {/* Bottom divider */}
        <div className="mt-16 pt-8 border-t border-stone-200/40 dark:border-stone-850/50 text-center">
          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">
            © {new Date().getFullYear()} TicoHabitat — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
