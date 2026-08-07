import { useState } from 'react';
import { importsService } from '../services/imports.service';

export default function ImportsPage() {
  const [loadingWpCash, setLoadingWpCash] = useState(false);
  const [loadingWpCosts, setLoadingWpCosts] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [message, setMessage] = useState('');

  const handleImportWpCash = async () => {
    try {
      setLoadingWpCash(true);
      setMessage('');
      const res = await importsService.importWpCashRegisters();
      setMessage(res.message || 'Sucesso ao importar caixas do WP');
    } catch (error) {
      setMessage('Erro na importação de caixas do WP');
    } finally {
      setLoadingWpCash(false);
    }
  };

  const handleImportWpProductCosts = async () => {
    try {
      setLoadingWpCosts(true);
      setMessage('');
      const res = await importsService.importWpProductCosts();
      setMessage(res.message || 'Sucesso ao importar custos do WP');
    } catch (error) {
      setMessage('Erro na importação de custos do WP');
    } finally {
      setLoadingWpCosts(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Tem certeza que deseja limpar o banco de dados? Esta ação apagará categorias, produtos, clientes, pedidos e caixas (com lançamentos). As configurações, variações e usuários serão mantidos.')) {
      return;
    }
    
    try {
      setLoadingClear(true);
      setMessage('');
      const res = await importsService.clearDatabase();
      setMessage(res.message || 'Banco limpo com sucesso');
    } catch (error) {
      setMessage('Erro ao limpar o banco de dados');
    } finally {
      setLoadingClear(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Módulo de Importação</h1>
        <button
          onClick={handleClearDatabase}
          disabled={loadingClear}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loadingClear ? 'Limpando...' : 'Limpar Banco de Dados'}
        </button>
      </div>
      
      {message && <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">{message}</div>}

      <div className="pt-4 border-t">
        <h2 className="text-xl font-bold mb-6">Módulo de Importação (WordPress Legacy)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Caixas e Financeiro</h2>
            
            <button 
              onClick={handleImportWpCash} 
              disabled={loadingWpCash}
              className="mt-auto mb-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 w-full"
            >
              {loadingWpCash ? 'Importando...' : 'Iniciar Importação WP (Caixas)'}
            </button>
            <button 
              onClick={handleImportWpProductCosts} 
              disabled={loadingWpCosts}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 w-full"
            >
              {loadingWpCosts ? 'Importando...' : 'Iniciar Importação WP (Custos)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
