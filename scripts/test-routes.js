const { spawn } = require('child_process');
const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// List of all routes to verify
const testCases = [
  // 1. Root and Locale Redirections
  {
    path: '/',
    expectedStatus: 307,
    expectedRedirect: '/es'
  },
  {
    path: '/es',
    expectedStatus: 200,
    contentKeywords: ['<html lang="es"', 'TicoHabitat']
  },
  {
    path: '/en',
    expectedStatus: 200,
    contentKeywords: ['<html lang="en"', 'TicoHabitat']
  },

  // 2. Authentication and Recovery Pages
  {
    path: '/es/login',
    expectedStatus: 200,
    contentKeywords: ['Iniciar Sesión', 'correo', 'contraseña']
  },
  {
    path: '/en/login',
    expectedStatus: 200,
    contentKeywords: ['Log In', 'email', 'password']
  },
  {
    path: '/es/registro',
    expectedStatus: 200,
    contentKeywords: ['cuenta de anunciante', 'Teléfono Móvil']
  },
  {
    path: '/en/registro',
    expectedStatus: 200,
    contentKeywords: ['advertiser account', 'Mobile Phone']
  },
  {
    path: '/es/recuperar-contrasena',
    expectedStatus: 200,
    contentKeywords: ['¿Olvidaste tu contraseña?', 'recuperación']
  },
  {
    path: '/en/recuperar-contrasena',
    expectedStatus: 200,
    contentKeywords: ['Forgot your password?', 'recovery']
  },
  {
    path: '/es/restablecer',
    expectedStatus: 200,
    contentKeywords: ['Enlace Inválido', 'Falta el token de seguridad']
  },
  {
    path: '/en/restablecer',
    expectedStatus: 200,
    contentKeywords: ['Invalid Link', 'Missing required security token']
  },
  {
    path: '/es/verify-email',
    expectedStatus: 200,
    contentKeywords: ['Validando Enlace']
  },
  {
    path: '/en/verify-email',
    expectedStatus: 200,
    contentKeywords: ['Validating Link']
  },

  // 3. Main Product & Listing Pages
  {
    path: '/es/comprar',
    expectedStatus: 200,
    contentKeywords: ['Comprar']
  },
  {
    path: '/en/comprar',
    expectedStatus: 200,
    contentKeywords: ['Buy']
  },
  {
    path: '/es/alquilar',
    expectedStatus: 200,
    contentKeywords: ['Alquilar']
  },
  {
    path: '/en/alquilar',
    expectedStatus: 200,
    contentKeywords: ['Rent']
  },
  {
    path: '/es/comprar/san-jose',
    expectedStatus: 200,
    contentKeywords: ['San José']
  },
  {
    path: '/es/alquilar/alajuela',
    expectedStatus: 200,
    contentKeywords: ['Alajuela']
  },
  {
    path: '/es/comprar/non-existent-province',
    expectedStatus: 200,
    contentKeywords: ['Provincia no válida']
  },

  // 4. Content and Platform Pages
  {
    path: '/es/faq',
    expectedStatus: 200,
    contentKeywords: ['Preguntas Frecuentes']
  },
  {
    path: '/en/faq',
    expectedStatus: 200,
    contentKeywords: ['Frequently Asked Questions']
  },
  {
    path: '/es/terminos',
    expectedStatus: 200,
    contentKeywords: ['Términos y Condiciones']
  },
  {
    path: '/en/terminos',
    expectedStatus: 200,
    contentKeywords: ['Terms and Conditions']
  },
  {
    path: '/es/agencias',
    expectedStatus: 200,
    contentKeywords: ['Inmobiliarias']
  },
  {
    path: '/en/agencias',
    expectedStatus: 200,
    contentKeywords: ['Real Estate Agencies']
  },

  // 5. Auth-Protected Dashboard & Admin Pages (Redirect tests / Access Denied tests)
  {
    path: '/es/dashboard',
    expectedStatus: 307,
    expectedRedirect: '/es/login'
  },
  {
    path: '/en/dashboard',
    expectedStatus: 307,
    expectedRedirect: '/en/login'
  },
  {
    path: '/es/admin',
    expectedStatus: 200,
    contentKeywords: ['Acceso Denegado', 'Se requiere una cuenta de administrador']
  },
  {
    path: '/en/admin',
    expectedStatus: 200,
    contentKeywords: ['Access Denied', 'A TicoHabitat administrator account is required']
  },
  {
    path: '/es/admin/monetizacion',
    expectedStatus: 307,
    expectedRedirect: '/es/login'
  },
  {
    path: '/en/admin/monetizacion',
    expectedStatus: 307,
    expectedRedirect: '/en/login'
  },

  // 6. Meta Config & Assets
  {
    path: '/robots.txt',
    expectedStatus: 200,
    contentKeywords: ['User-agent']
  },
  {
    path: '/sitemap.xml',
    expectedStatus: 200,
    contentKeywords: ['urlset', 'sitemap']
  },
  {
    path: '/icon.png',
    expectedStatus: 200
  }
];

// Helper to make requests with redirect checks
function checkRoute(testCase) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${testCase.path}`;
    
    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          path: testCase.path,
          status: res.statusCode,
          passed: true,
          details: []
        };

        // Assert correct status code
        if (res.statusCode !== testCase.expectedStatus) {
          result.passed = false;
          result.details.push(`Expected status ${testCase.expectedStatus}, got ${res.statusCode}`);
        }

        // Assert redirect target location
        if (testCase.expectedRedirect) {
          const redirectLocation = res.headers.location;
          const relativeLocation = redirectLocation ? redirectLocation.replace(BASE_URL, '') : '';
          
          const cleanExpected = testCase.expectedRedirect.replace(/\/$/, '');
          const cleanRelative = relativeLocation.replace(/\/$/, '');
          
          if (cleanRelative !== cleanExpected && redirectLocation !== testCase.expectedRedirect) {
            result.passed = false;
            result.details.push(`Expected redirect to "${testCase.expectedRedirect}", got "${relativeLocation || redirectLocation}"`);
          }
        }

        // Assert content keywords
        if (testCase.contentKeywords) {
          const lowerData = data.toLowerCase();
          for (const word of testCase.contentKeywords) {
            if (!lowerData.includes(word.toLowerCase())) {
              result.passed = false;
              result.details.push(`Expected page content to include "${word}" (case-insensitive check), keyword check failed.`);
            }
          }
        }

        resolve(result);
      });
    }).on('error', (err) => {
      resolve({
        path: testCase.path,
        passed: false,
        details: [`Network error: ${err.message}`]
      });
    });
  });
}

// Poll server until healthy
function waitForServer() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30;

    const check = () => {
      attempts++;
      http.get(BASE_URL + '/robots.txt', (res) => {
        if (res.statusCode === 200) {
          console.log(`Server is healthy and ready on port ${PORT}!`);
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(new Error('Server failed to start in time.'));
      } else {
        setTimeout(check, 1000);
      }
    };

    check();
  });
}

// Main Runner
async function main() {
  console.log('Spawning Next.js production server...');
  
  // Spawn `npm run start` or `next start` on Windows
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    shell: true,
    stdio: 'ignore'
  });

  // Ensure clean termination on exit
  const cleanup = () => {
    console.log('Terminating Next.js server...');
    server.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    server.kill();
  });

  try {
    await waitForServer();

    console.log(`\nRunning ${testCases.length} Route Integration Test Cases...\n`);
    
    let passedCount = 0;
    let failedCount = 0;
    
    for (const testCase of testCases) {
      const result = await checkRoute(testCase);
      
      if (result.passed) {
        console.log(`[PASS] ${result.path} - Returned status ${result.status}`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${result.path} - Status ${result.status || 'ERROR'}`);
        result.details.forEach(detail => console.error(`       -> ${detail}`));
        failedCount++;
      }
    }

    console.log(`\n======================================`);
    console.log(`Route Verification Run Results:`);
    console.log(`Total Passed: ${passedCount}`);
    console.log(`Total Failed: ${failedCount}`);
    console.log(`======================================\n`);

    if (failedCount > 0) {
      process.exitCode = 1;
    } else {
      console.log('All routes are functioning correctly with zero errors!');
      process.exitCode = 0;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}

main();
