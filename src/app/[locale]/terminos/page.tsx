import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

interface TerminosPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TerminosPageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'es' ? locale : 'es';
  const isEn = lang === 'en';
  return {
    title: isEn ? 'Terms and Conditions | TicoHabitat' : 'Términos y Condiciones | TicoHabitat',
    description: isEn 
      ? 'Terms and conditions of use of the TicoHabitat platform for publishing and searching properties in Costa Rica.'
      : 'Términos y condiciones de uso de la plataforma TicoHabitat para la publicación y búsqueda de propiedades en Costa Rica.',
    alternates: {
      canonical: `/${lang}/terminos`,
    },
  };
}

export default async function TerminosPage({ params }: TerminosPageProps) {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'es' ? locale : 'es';
  const isEn = lang === 'en';

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-stone-555 mb-8 uppercase tracking-wider">
          <Link href={`/${lang}`} className="hover:text-primary transition-colors">
            {isEn ? 'Home' : 'Inicio'}
          </Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">
            {isEn ? 'Terms and Conditions' : 'Términos y Condiciones'}
          </span>
        </div>

        {/* Header */}
        <div className="text-left mb-14 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
            {isEn ? (
              <>
                Terms and <span className="text-primary">Conditions</span>
              </>
            ) : (
              <>
                Términos y <span className="text-primary">Condiciones</span>
              </>
            )}
          </h1>
          <p className="text-sm font-medium text-stone-550 dark:text-stone-400 mt-4 leading-relaxed">
            {isEn ? 'Last updated: May 31, 2026' : 'Última actualización: 31 de mayo de 2026'}
          </p>
        </div>

        {/* Content */}
        <div className="prose-container space-y-10">
          {isEn ? (
            // English Content
            <>
              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    By accessing and using the TicoHabitat platform (hereinafter &ldquo;the Platform&rdquo;), operated under the domain ticohabitat.com, you agree to be bound by these Terms and Conditions of use. If you do not agree with any of these terms, please refrain from using the Platform.
                  </p>
                  <p>
                    TicoHabitat reserves the right to modify these terms at any time. Modifications will take effect upon publication on this page. Continued use of the Platform after such modifications constitutes your acceptance of the updated terms.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  2. Description of Service
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    TicoHabitat is a digital real estate classifieds platform focused exclusively on Costa Rica. It allows users to publish property listings for sale and rent, as well as search for and contact property owners directly.
                  </p>
                  <p>
                    The Platform acts solely as a technological intermediary. TicoHabitat is not a real estate agency, does not participate in purchase/sale or rental transactions, does not charge commissions on these transactions, and does not guarantee the completion of any business between the parties.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  3. Registration and Identity Verification
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    To publish listings, users must create an account by providing a valid email address and a secure password. Additionally, the Platform requires mandatory verification of the email address through a secure link or OTP code sent to your inbox.
                  </p>
                  <p>
                    This verification aims to:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>Confirm the legitimacy of the advertiser.</li>
                    <li>Prevent the publication of spam or fraudulent listings.</li>
                    <li>Guarantee a secure and reliable transaction environment.</li>
                  </ul>
                  <p>
                    The user is responsible for maintaining the confidentiality of their access credentials. Any activity carried out from their account will be considered to be performed by the account holder.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  4. Publishing Listings
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    By publishing a listing on TicoHabitat, the user represents and warrants that:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>They are the legitimate owner of the property or have express authorization to publish it.</li>
                    <li>The information provided (price, location, features, photos) is true and accurate.</li>
                    <li>The photographs are real and correspond to the advertised property.</li>
                    <li>The property is available for the indicated transaction (sale or rent).</li>
                  </ul>
                  <p>
                    Basic listings are free and active for 30 calendar days. After this period, the listing will be automatically marked as expired. The user can renew it from their control panel.
                  </p>
                  <p>
                    TicoHabitat reserves the right to remove, without prior notice, listings containing false, duplicate, or offensive information, or that violate third-party rights or do not correspond to real estate properties.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  5. Featured Listings and Payments
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    TicoHabitat offers the option to feature listings through a paid service. Featured listings receive greater visibility by appearing in the Platform's premium sections (&ldquo;Premium Recommendations&rdquo;).
                  </p>
                  <p>
                    Prices, duration, and conditions of featuring plans are indicated at the time of purchase. Once payment is made, the featuring service is non-refundable, unless TicoHabitat determines otherwise at its discretion.
                  </p>
                  <p>
                    Featuring a listing does not imply approval, endorsement, or additional verification of the listing's content by TicoHabitat.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  6. User Conduct
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    Users agree:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>Not to publish false, misleading, defamatory, or offensive content.</li>
                    <li>Not to use the Platform for illegal activities or activities contrary to Costa Rican law.</li>
                    <li>Not to publish the same listing more than once simultaneously.</li>
                    <li>Not to attempt to bypass the Platform's verification or security systems.</li>
                    <li>Not to use automated systems (bots, scrapers) to access or extract data from the Platform.</li>
                    <li>To respect other users in all communications arising from the Platform.</li>
                  </ul>
                  <p>
                    Failure to comply with these rules may result in the temporary or permanent suspension of the user's account, as well as the deletion of their listings.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  7. Personal Data Protection
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    TicoHabitat collects and processes personal data necessary for the operation of the service, including: name, email address, mobile number, and data of the published properties.
                  </p>
                  <p>
                    These data are used exclusively to:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>Manage the user's account and listings.</li>
                    <li>Facilitate contact between buyers/tenants and owners.</li>
                    <li>Send service-related notifications.</li>
                    <li>Prevent fraud and ensure the security of the Platform.</li>
                  </ul>
                  <p>
                    TicoHabitat does not sell, rent, or share personal data with third parties for advertising purposes. Data are stored in secure servers with encryption and controlled access, in compliance with the Law on the Protection of Individuals against the Processing of their Personal Data (Law No. 8968 of Costa Rica).
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  8. Limitation of Liability
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    TicoHabitat is not responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>The truthfulness, accuracy, or legality of the information published by users.</li>
                    <li>The quality, state, or actual condition of the advertised properties.</li>
                    <li>Negotiations, agreements, or transactions conducted between users outside the Platform.</li>
                    <li>Direct or indirect damages arising from the use of the Platform.</li>
                    <li>Temporary service interruptions for maintenance or due to force majeure.</li>
                  </ul>
                  <p>
                    Users are advised to independently verify property information before making any purchase or rental decision. TicoHabitat advises making personal visits and consulting with legal professionals before formalizing real estate transactions.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  9. Intellectual Property
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    All content on the Platform, including but not limited to design, code, logos, texts, graphics, and interfaces, is the property of TicoHabitat and/or its developers (SoutLabs) and is protected by applicable intellectual property laws.
                  </p>
                  <p>
                    By publishing content (photos, texts, descriptions) on the Platform, the user grants TicoHabitat a non-exclusive, worldwide, and free license to display, reproduce, and distribute such content exclusively within the Platform and its promotional channels.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  10. Applicable Law and Jurisdiction
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    These Terms and Conditions are governed by the laws of the Republic of Costa Rica. For any controversy arising from the use of the Platform, the parties submit to the jurisdiction of the competent courts of San José, Costa Rica.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section className="space-y-4">
                <h2 className="font-display text-lg font-extrabold text-stone-900 dark:text-white">
                  11. Contact
                </h2>
                <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed space-y-3">
                  <p>
                    For any questions, claims, or requests related to these Terms and Conditions, you can contact us through:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>
                      <strong className="text-stone-700 dark:text-stone-300">WhatsApp:</strong>{' '}
                      <a href="https://wa.me/50660677055" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        +506 6067-7055
                      </a>
                    </li>
                    <li>
                      <strong className="text-stone-700 dark:text-stone-300">Platform:</strong>{' '}
                      <Link href={`/${lang}`} className="text-primary hover:underline">
                        ticohabitat.com
                      </Link>
                    </li>
                  </ul>
                </div>
              </section>
            </>
          ) : (
            // Spanish Content
            <>
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
                      <Link href={`/${lang}`} className="text-primary hover:underline">
                        ticohabitat.com
                      </Link>
                    </li>
                  </ul>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Bottom divider */}
        <div className="mt-16 pt-8 border-t border-stone-200/40 dark:border-stone-850/50 text-center">
          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">
            © {new Date().getFullYear()} TicoHabitat — {isEn ? 'All rights reserved' : 'Todos los derechos reservados'}
          </p>
        </div>
      </div>
    </div>
  );
}
