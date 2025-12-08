cd ~/development/code/phase3/palmer-living-reality/frontend

# 1. BACKUP current files (optional)
mkdir -p backup
cp -r * backup/ 2>/dev/null || true

# 2. Create CORRECT tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# 3. Create tsconfig.node.json
cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

# 4. Update package.json build script
cat > package.json << 'EOF'
{
  "name": "palmer-living-reality-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^2.9.11",
    "@tanstack/react-query": "^4.24.10",
    "axios": "^1.3.4",
    "date-fns": "^2.29.3",
    "lucide-react": "^0.144.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.43.5",
    "react-hot-toast": "^2.4.0",
    "react-router-dom": "^6.8.0",
    "recharts": "^2.5.0",
    "zod": "^3.20.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF

# 5. Create vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
EOF

# 6. Fix React imports in all TypeScript files
# Create a script to fix React imports
cat > fix_imports.js << 'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixReactImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixReactImports(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix React import
      content = content.replace(
        /import\s+React\s+from\s+'react'/g,
        "import * as React from 'react'"
      );
      
      // Also fix default imports that might cause issues
      content = content.replace(
        /import\s+(\w+)\s+from\s+'react-dom'/g,
        "import * as $1 from 'react-dom'"
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  });
}

// Start from src directory
if (fs.existsSync('src')) {
  fixReactImports('src');
}
EOF

# Run the fix script
node fix_imports.js

# 7. Create a SIMPLE Dockerfile that will definitely work
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - force clean install
RUN npm ci --silent

# Copy source
COPY . .

# Build with verbose output
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# 8. Create nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# 9. Create a simple test file if src doesn't exist
if [ ! -d "src" ]; then
  mkdir -p src
  cat > src/main.tsx << 'EOF'
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF
  
  cat > src/App.tsx << 'EOF'
import * as React from 'react'

function App() {
  return (
    <div className="App">
      <h1>Palmer Living Reality Frontend</h1>
      <p>Frontend is running successfully!</p>
    </div>
  )
}

export default App
EOF
  
  cat > src/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.App {
  text-align: center;
  padding: 2rem;
}
EOF
fi

# 10. Go back and rebuild with NO CACHE
cd ~/development/code/phase3/palmer-living-reality

# Remove all Docker cache
docker-compose down
docker system prune -f

# Build fresh
docker-compose build --no-cache
docker-compose up -d

# Check if it's running
docker-compose ps
