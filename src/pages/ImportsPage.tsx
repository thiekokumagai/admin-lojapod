import { useState } from 'react';
import { importsService } from '../services/imports.service';

export default function ImportsPage() {
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingProductImages, setLoadingProductImages] = useState(false);
  const [loadingProductVariations, setLoadingProductVariations] = useState(false);
  const [loadingFixCategories, setLoadingFixCategories] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
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

  const handleImportCategories = async () => {
    try {
      setLoadingCategory(true);
      setMessage('');
      const res = await importsService.importCategories();
      setMessage(res.message || 'Sucesso');
    } catch (error) {
      setMessage('Erro na importação de categorias');
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleImportProducts = async () => {
    try {
      setLoadingProduct(true);
      setMessage('');
      const res = await importsService.importProducts();
      setMessage(res.message || 'Sucesso');
    } catch (error) {
      setMessage('Erro na importação de produtos');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleFixCategories = async () => {
    try {
      setLoadingFixCategories(true);
      setMessage('');
      const res = await importsService.fixProductCategories();
      setMessage(`${res.message || 'Sucesso'} (Analisados: ${res.data?.totalAnalyzed || 0}, Atualizados: ${res.data?.totalUpdated || 0})`);
    } catch (error) {
      setMessage('Erro na correção de categorias de produtos');
    } finally {
      setLoadingFixCategories(false);
    }
  };

  const handleImportProductImages = async () => {
    try {
      setLoadingProductImages(true);
      setMessage('');
      const res = await importsService.importProductImages();
      setMessage(res.message || 'Sucesso');
    } catch (error) {
      setMessage('Erro na importação das imagens dos produtos');
    } finally {
      setLoadingProductImages(false);
    }
  };

  const handleImportProductVariations = async () => {
    try {
      setLoadingProductVariations(true);
      setMessage('');
      const res = await importsService.importProductVariations();
      setMessage(res.message || 'Sucesso');
    } catch (error) {
      setMessage('Erro na importação das variações dos produtos');
    } finally {
      setLoadingProductVariations(false);
    }
  };

  const handleImportOrders = async () => {
    try {
      setLoadingOrder(true);
      setMessage('');
      const res = await importsService.importOrders();
      setMessage(res.message || 'Sucesso');
    } catch (error) {
      setMessage('Erro na importação de pedidos');
    } finally {
      setLoadingOrder(false);
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
        <h1 className="text-2xl font-bold">Módulo de Importação (Vendizap)</h1>
        <button
          onClick={handleClearDatabase}
          disabled={loadingClear}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loadingClear ? 'Limpando...' : 'Limpar Banco de Dados'}
        </button>
      </div>
      
      {message && <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categorias */}
        <div className="border rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Categorias</h2>
          <p className="text-gray-600 text-center mb-4 text-sm">
            Importa todas as categorias, mapeia IDs externos e faz download das imagens.
          </p>
          <button 
            onClick={handleImportCategories} 
            disabled={loadingCategory}
            className="mt-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingCategory ? 'Importando...' : 'Sincronizar Categorias'}
          </button>
        </div>

        {/* Produtos */}
        <div className="border rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Produtos</h2>
          <p className="text-gray-600 text-center mb-4 text-sm">
            Importa produtos e variações, relaciona com categorias importadas e baixa imagens.
          </p>
          <div className="mt-auto flex flex-col w-full gap-2">
            <button 
              onClick={handleImportProducts} 
              disabled={loadingProduct || loadingProductImages || loadingProductVariations || loadingFixCategories}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingProduct ? 'Importando...' : 'Sincronizar Produtos'}
            </button>
            <button 
              onClick={handleFixCategories} 
              disabled={loadingProduct || loadingProductImages || loadingProductVariations || loadingFixCategories}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loadingFixCategories ? 'Corrigindo...' : 'Corrigir Categorias via API Indiv.'}
            </button>
            <button 
              onClick={handleImportProductImages} 
              disabled={loadingProduct || loadingProductImages || loadingProductVariations || loadingFixCategories}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingProductImages ? 'Baixando Imagens...' : 'Baixar Imagens'}
            </button>
            <button 
              onClick={handleImportProductVariations} 
              disabled={loadingProduct || loadingProductImages || loadingProductVariations || loadingFixCategories}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
            >
              {loadingProductVariations ? 'Importando Variações...' : 'Importar Variações e Estoque'}
            </button>
          </div>
        </div>

        {/* Pedidos */}
        <div className="border rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Pedidos</h2>
          <p className="text-gray-600 text-center mb-4 text-sm">
            Importa histórico de pedidos e cadastra clientes automaticamente caso não existam.
          </p>
          <button 
            onClick={handleImportOrders} 
            disabled={loadingOrder}
            className="mt-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingOrder ? 'Importando...' : 'Sincronizar Pedidos'}
          </button>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t">
        <h2 className="text-xl font-bold mb-6">Módulo de Importação (WordPress Legacy)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">Caixas e Financeiro</h2>
            
            <button 
              onClick={handleImportWpCash} 
              disabled={loadingWpCash}
              className="mt-auto mb-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              {loadingWpCash ? 'Importando...' : 'Iniciar Importação WP (Caixas)'}
            </button>
            <button 
              onClick={handleImportWpProductCosts} 
              disabled={loadingWpCosts}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              {loadingWpCosts ? 'Importando...' : 'Iniciar Importação WP (Custos)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
