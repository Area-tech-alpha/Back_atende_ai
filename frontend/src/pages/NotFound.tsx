
import { Link } from 'react-router-dom';
import { MessagesSquare, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <MessagesSquare size={48} className="text-primary" />
          </div>
        </div>
        <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-3">
          404
        </h1>
        <h2 className="text-3xl font-display font-bold text-accent mb-4">
          Página Não Encontrada
        </h2>
        <p className="text-accent/60 mb-8 max-w-md mx-auto">
          A página que você está procurando pode ter sido removida, teve seu nome alterado ou está temporariamente indisponível.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center"
        >
          <Home size={20} className="mr-2" />
          Ir para o Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;