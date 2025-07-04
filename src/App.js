import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Plus, TrendingUp, Activity, AlertCircle, Edit3, Trash2, Save, Database, Wifi, WifiOff, Loader2, Cloud } from 'lucide-react';

// Service Supabase
class SupabaseService {
  constructor() {
    this.baseUrl = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/cycles`;
    this.headers = {
      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async getAllCycles() {
    const response = await fetch(`${this.baseUrl}?order=start_date.asc`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map(cycle => ({
      id: cycle.id,
      startDate: cycle.start_date,
      endDate: cycle.end_date,
      flow: cycle.flow || 'normal',
      symptoms: cycle.symptoms || [],
      preSymptoms: cycle.pre_symptoms || [],
      notes: cycle.notes || '',
      length: cycle.length || this.calculateLength(cycle.start_date, cycle.end_date)
    }));
  }

  async createCycle(cycleData) {
    const supabaseData = {
      start_date: cycleData.startDate,
      end_date: cycleData.endDate,
      flow: cycleData.flow,
      symptoms: cycleData.symptoms,
      pre_symptoms: cycleData.preSymptoms,
      notes: cycleData.notes,
      length: cycleData.length
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(supabaseData)
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data[0].id,
      startDate: data[0].start_date,
      endDate: data[0].end_date,
      flow: data[0].flow,
      symptoms: data[0].symptoms || [],
      preSymptoms: data[0].pre_symptoms || [],
      notes: data[0].notes || '',
      length: data[0].length
    };
  }

  async updateCycle(cycleId, cycleData) {
    const supabaseData = {
      start_date: cycleData.startDate,
      end_date: cycleData.endDate,
      flow: cycleData.flow,
      symptoms: cycleData.symptoms,
      pre_symptoms: cycleData.preSymptoms,
      notes: cycleData.notes,
      length: cycleData.length
    };

    const response = await fetch(`${this.baseUrl}?id=eq.${cycleId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(supabaseData)
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return { id: cycleId, ...cycleData };
  }

  async deleteCycle(cycleId) {
    const response = await fetch(`${this.baseUrl}?id=eq.${cycleId}`, {
      method: 'DELETE',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return true;
  }

  calculateLength(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }
}

const CycleTracker = () => {
  const [cycles, setCycles] = useState([]);
  const [isAddingCycle, setIsAddingCycle] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [newCycle, setNewCycle] = useState({
    startDate: '',
    endDate: '',
    flow: 'normal',
    symptoms: [],
    preSymptoms: [],
    notes: ''
  });

  const supabaseService = new SupabaseService();

  // Vérifier la configuration Supabase
  useEffect(() => {
    const hasSupabaseConfig = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY;
    setSupabaseConfigured(hasSupabaseConfig);
    console.log('🔧 Configuration Supabase:', hasSupabaseConfig ? 'OK' : 'Manquante');
  }, []);

  // Détecter le statut de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les données au démarrage
  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    setLoading(true);
    setError(null);

    try {
      if (supabaseConfigured && isOnline) {
        console.log('🌐 Chargement depuis Supabase...');
        const supabaseCycles = await supabaseService.getAllCycles();
        setCycles(supabaseCycles);
        
        // Sauvegarder localement comme backup
        localStorage.setItem('menstrualCycles', JSON.stringify(supabaseCycles));
        console.log('✅ Données chargées depuis Supabase:', supabaseCycles.length, 'cycles');
      } else {
        console.log('💾 Chargement depuis localStorage...');
        const localCycles = localStorage.getItem('menstrualCycles');
        if (localCycles) {
          const parsedCycles = JSON.parse(localCycles);
          setCycles(parsedCycles);
          console.log('✅ Données chargées localement:', parsedCycles.length, 'cycles');
        }
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Erreur de connexion. Chargement des données locales...');
      
      // En cas d'erreur, charger depuis le localStorage
      const localCycles = localStorage.getItem('menstrualCycles');
      if (localCycles) {
        const parsedCycles = JSON.parse(localCycles);
        setCycles(parsedCycles);
      }
    } finally {
      setLoading(false);
    }
  };

  const symptoms = [
    'Crampes', 'Maux de tête', 'Fatigue', 'Ballonnements', 
    'Sautes d\'humeur', 'Douleurs mammaires', 'Nausées', 'Acné'
  ];

  const preSymptoms = [
    'Irritabilité', 'Fringales', 'Sensibilité mammaire', 'Ballonnements',
    'Fatigue', 'Maux de tête', 'Sautes d\'humeur', 'Troubles du sommeil',
    'Douleurs abdominales', 'Anxiété', 'Déprime', 'Rétention d\'eau'
  ];

  const handleSymptomChange = (symptom, isChecked) => {
    setNewCycle(prev => ({
      ...prev,
      symptoms: isChecked 
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const handlePreSymptomChange = (symptom, isChecked) => {
    setNewCycle(prev => ({
      ...prev,
      preSymptoms: isChecked 
        ? [...prev.preSymptoms, symptom]
        : prev.preSymptoms.filter(s => s !== symptom)
    }));
  };

  const calculateCycleLength = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateDaysBetweenCycles = (prevEndDate, nextStartDate) => {
    const prevEnd = new Date(prevEndDate);
    const nextStart = new Date(nextStartDate);
    return Math.ceil((nextStart - prevEnd) / (1000 * 60 * 60 * 24)) - 1;
  };

  const addCycle = async () => {
    console.log('🔄 Début de addCycle');
    
    // Validation des données
    if (!newCycle.startDate || !newCycle.endDate) {
      setError('Veuillez remplir les dates de début et de fin');
      return;
    }

    const startDate = new Date(newCycle.startDate);
    const endDate = new Date(newCycle.endDate);
    
    if (endDate < startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cycleLength = calculateCycleLength(newCycle.startDate, newCycle.endDate);
      const cycleToAdd = { ...newCycle, length: cycleLength };
      
      if (supabaseConfigured && isOnline) {
        console.log('🌐 Ajout à Supabase...');
        const createdCycle = await supabaseService.createCycle(cycleToAdd);
        const updatedCycles = [...cycles, createdCycle].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setCycles(updatedCycles);
        localStorage.setItem('menstrualCycles', JSON.stringify(updatedCycles));
        console.log('✅ Cycle ajouté à Supabase');
      } else {
        console.log('💾 Ajout local...');
        const localCycle = {
          id: Date.now(),
          ...cycleToAdd,
          _isPending: !supabaseConfigured || !isOnline
        };
        const updatedCycles = [...cycles, localCycle].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setCycles(updatedCycles);
        localStorage.setItem('menstrualCycles', JSON.stringify(updatedCycles));
        
        if (!supabaseConfigured) {
          setError('Mode local uniquement - configurez Supabase pour la synchronisation');
        } else if (!isOnline) {
          setError('Mode hors ligne - les données seront synchronisées quand vous serez reconnectée');
        }
      }
      
      // Réinitialiser le formulaire
      setNewCycle({
        startDate: '',
        endDate: '',
        flow: 'normal',
        symptoms: [],
        preSymptoms: [],
        notes: ''
      });
      
      setIsAddingCycle(false);
      setSuccess('Cycle ajouté avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout:', err);
      setError(`Erreur lors de l'ajout du cycle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editCycle = (cycle) => {
    setEditingCycle(cycle);
    setNewCycle({
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      flow: cycle.flow,
      symptoms: cycle.symptoms || [],
      preSymptoms: cycle.preSymptoms || [],
      notes: cycle.notes || ''
    });
    setIsAddingCycle(true);
  };

  const updateCycle = async () => {
    if (!editingCycle || !newCycle.startDate || !newCycle.endDate) {
      setError('Veuillez remplir toutes les données requises');
      return;
    }

    const startDate = new Date(newCycle.startDate);
    const endDate = new Date(newCycle.endDate);
    
    if (endDate < startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cycleLength = calculateCycleLength(newCycle.startDate, newCycle.endDate);
      const updatedCycleData = { ...newCycle, length: cycleLength };
      
      if (supabaseConfigured && isOnline && !editingCycle.id.toString().startsWith('temp_')) {
        await supabaseService.updateCycle(editingCycle.id, updatedCycleData);
      }
      
      const updatedCycles = cycles.map(cycle => 
        cycle.id === editingCycle.id ? { id: editingCycle.id, ...updatedCycleData } : cycle
      ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      setCycles(updatedCycles);
      localStorage.setItem('menstrualCycles', JSON.stringify(updatedCycles));
      
      setEditingCycle(null);
      setNewCycle({
        startDate: '',
        endDate: '',
        flow: 'normal',
        symptoms: [],
        preSymptoms: [],
        notes: ''
      });
      setIsAddingCycle(false);
      setSuccess('Cycle mis à jour avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      setError('Erreur lors de la mise à jour du cycle');
    } finally {
      setLoading(false);
    }
  };

  const deleteCycle = async (cycleId) => {
    if (!window.confirm('Êtes-vous sûre de vouloir supprimer ce cycle ?')) {
      return;
    }

    setLoading(true);

    try {
      if (supabaseConfigured && isOnline && !cycleId.toString().startsWith('temp_')) {
        await supabaseService.deleteCycle(cycleId);
      }
      
      const updatedCycles = cycles.filter(cycle => cycle.id !== cycleId);
      setCycles(updatedCycles);
      localStorage.setItem('menstrualCycles', JSON.stringify(updatedCycles));
      setSuccess('Cycle supprimé avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du cycle');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(cycles, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cycles-menstruels-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setSuccess('Données exportées avec succès !');
    setTimeout(() => setSuccess(null), 3000);
  };

  const chartData = useMemo(() => {
    return cycles.map((cycle, index) => {
      const cycleNumber = index + 1;
      const prevCycle = cycles[index - 1];
      const daysBetween = prevCycle ? calculateDaysBetweenCycles(prevCycle.endDate, cycle.startDate) : null;
      
      return {
        cycle: `Cycle ${cycleNumber}`,
        date: new Date(cycle.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        duree: cycle.length,
        intervalleAvant: daysBetween,
        cycleTotalLength: daysBetween ? cycle.length + daysBetween : cycle.length
      };
    });
  }, [cycles]);

  const stats = useMemo(() => {
    if (cycles.length === 0) return null;
    
    const lengths = cycles.map(c => c.length);
    const intervals = cycles.slice(1).map((cycle, index) => 
      calculateDaysBetweenCycles(cycles[index].endDate, cycle.startDate)
    );
    
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    
    const lengthVariation = Math.max(...lengths) - Math.min(...lengths);
    const intervalVariation = intervals.length > 0 ? Math.max(...intervals) - Math.min(...intervals) : 0;
    
    return {
      avgLength: avgLength.toFixed(1),
      avgInterval: avgInterval.toFixed(1),
      lengthVariation,
      intervalVariation,
      totalCycles: cycles.length
    };
  }, [cycles]);

  const getFlowColor = (flow) => {
    switch (flow) {
      case 'light': return 'bg-pink-200';
      case 'normal': return 'bg-pink-400';
      case 'heavy': return 'bg-pink-600';
      default: return 'bg-pink-400';
    }
  };

  const getFlowText = (flow) => {
    switch (flow) {
      case 'light': return 'Léger';
      case 'normal': return 'Normal';
      case 'heavy': return 'Abondant';
      default: return 'Normal';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-pink-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Suivi du Cycle Menstruel</h1>
            <div className="flex items-center gap-2 ml-4">
              {supabaseConfigured ? (
                isOnline ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Cloud size={16} />
                    <span>Synchronisé</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600 text-sm">
                    <WifiOff size={16} />
                    <span>Hors ligne</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1 text-blue-600 text-sm">
                  <Database size={16} />
                  <span>Local</span>
                </div>
              )}
              {loading && <Loader2 className="animate-spin text-blue-600" size={16} />}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={20} />
              Exporter
            </button>
            <button
              onClick={() => setIsAddingCycle(true)}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Ajouter un cycle
            </button>
          </div>
        </div>

        {/* Messages de succès */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-700">{success}</div>
            </div>
          </div>
        )}

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-orange-100 border-l-4 border-orange-400 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-orange-600 mr-2" size={20} />
              <p className="text-orange-800">{error}</p>
            </div>
          </div>
        )}

        {/* Info configuration */}
        {!supabaseConfigured && (
          <div className="bg-blue-100 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center">
              <Database className="text-blue-600 mr-2" size={20} />
              <div>
                <p className="font-semibold text-blue-800">Mode local actif</p>
                <p className="text-blue-700">
                  Configurez Supabase pour synchroniser vos données entre appareils.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-pink-100 to-pink-200 p-4 rounded-lg">
              <div className="text-pink-800 font-semibold">Durée moyenne</div>
              <div className="text-2xl font-bold text-pink-900">{stats.avgLength} jours</div>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg">
              <div className="text-purple-800 font-semibold">Intervalle moyen</div>
              <div className="text-2xl font-bold text-purple-900">{stats.avgInterval} jours</div>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg">
              <div className="text-blue-800 font-semibold">Variation durée</div>
              <div className="text-2xl font-bold text-blue-900">{stats.lengthVariation} jours</div>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg">
              <div className="text-green-800 font-semibold">Total cycles</div>
              <div className="text-2xl font-bold text-green-900">{stats.totalCycles}</div>
            </div>
          </div>
        )}

        {/* Alerte pour irrégularités */}
        {stats && (stats.lengthVariation > 7 || stats.intervalVariation > 10) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-2" size={20} />
              <div>
                <p className="font-semibold text-yellow-800">Irrégularités détectées</p>
                <p className="text-yellow-700">
                  Vos cycles présentent des variations importantes. Consultez un professionnel de santé si cela persiste.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphiques */}
      {cycles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-pink-600" size={24} />
              Durée des cycles
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="duree" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  name="Durée (jours)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-purple-600" size={24} />
              Intervalles entre cycles
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(1)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="intervalleAvant" 
                  fill="#a855f7"
                  name="Intervalle (jours)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Liste des cycles */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Historique des cycles</h2>
        {cycles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="mx-auto mb-4" size={48} />
            <p>Aucun cycle enregistré pour le moment.</p>
            <p>Cliquez sur "Ajouter un cycle" pour commencer votre suivi.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cycles.map((cycle, index) => (
              <div key={cycle.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${cycle._isPending ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">Cycle {index + 1}</h3>
                      <div className={`px-2 py-1 rounded text-white text-sm ${getFlowColor(cycle.flow)}`}>
                        {getFlowText(cycle.flow)}
                      </div>
                      {cycle._isPending && (
                        <div className="px-2 py-1 rounded bg-yellow-200 text-yellow-800 text-sm">
                          En attente de sync
                        </div>
                      )}
                    </div>
                    <div className="text-gray-600 mb-2">
                      <span className="font-medium">Du:</span> {new Date(cycle.startDate).toLocaleDateString('fr-FR')} 
                      <span className="mx-2">-</span>
                      <span className="font-medium">Au:</span> {new Date(cycle.endDate).toLocaleDateString('fr-FR')}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Durée:</span> {cycle.length} jours
                    </div>
                    {cycle.symptoms && cycle.symptoms.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Symptômes pendant:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cycle.symptoms.map(symptom => (
                            <span key={symptom} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {cycle.preSymptoms && cycle.preSymptoms.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Symptômes avant:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cycle.preSymptoms.map(symptom => (
                            <span key={symptom} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {cycle.notes && (
                      <div className="text-gray-600">
                        <span className="font-medium">Notes:</span> {cycle.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editCycle(cycle)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 disabled:text-blue-300 p-1"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteCycle(cycle.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:text-red-300 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire d'ajout/modification */}
      {isAddingCycle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg mx-auto my-4 sm:my-8 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
            {/* Header fixe */}
            <div className="p-4 sm:p-6 border-b bg-white rounded-t-lg">
              <h2 className="text-xl font-bold">
                {editingCycle ? 'Modifier le cycle' : 'Ajouter un nouveau cycle'}
              </h2>
            </div>
            
            {/* Contenu défilable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début *</label>
                  <input
                    type="date"
                    value={newCycle.startDate}
                    onChange={(e) => setNewCycle(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-pink-500 focus:outline-none text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin *</label>
                  <input
                    type="date"
                    value={newCycle.endDate}
                    onChange={(e) => setNewCycle(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-pink-500 focus:outline-none text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Intensité du flux</label>
                  <select
                    value={newCycle.flow}
                    onChange={(e) => setNewCycle(prev => ({ ...prev, flow: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-pink-500 focus:outline-none text-base"
                  >
                    <option value="light">Léger</option>
                    <option value="normal">Normal</option>
                    <option value="heavy">Abondant</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Symptômes avant le cycle (SPM)</label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {preSymptoms.map(symptom => (
                        <label key={symptom} className="flex items-center text-sm py-1">
                          <input
                            type="checkbox"
                            checked={newCycle.preSymptoms.includes(symptom)}
                            onChange={(e) => handlePreSymptomChange(symptom, e.target.checked)}
                            className="mr-2 min-w-4 min-h-4"
                          />
                          <span className="select-none">{symptom}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Symptômes pendant le cycle</label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {symptoms.map(symptom => (
                        <label key={symptom} className="flex items-center text-sm py-1">
                          <input
                            type="checkbox"
                            checked={newCycle.symptoms.includes(symptom)}
                            onChange={(e) => handleSymptomChange(symptom, e.target.checked)}
                            className="mr-2 min-w-4 min-h-4"
                          />
                          <span className="select-none">{symptom}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={newCycle.notes}
                    onChange={(e) => setNewCycle(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-pink-500 focus:outline-none text-base resize-none"
                    rows="3"
                    placeholder="Notes optionnelles..."
                  />
                </div>
              </div>
            </div>
            
            {/* Footer fixe avec boutons */}
            <div className="p-4 sm:p-6 border-t bg-white rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={editingCycle ? updateCycle : addCycle}
                  disabled={loading || !newCycle.startDate || !newCycle.endDate}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white py-3 px-4 rounded-lg transition-colors font-medium text-base order-2 sm:order-1"
                >
                  {loading ? 'Traitement...' : (editingCycle ? 'Mettre à jour' : 'Ajouter')}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCycle(false);
                    setEditingCycle(null);
                    setError(null);
                    setNewCycle({
                      startDate: '',
                      endDate: '',
                      flow: 'normal',
                      symptoms: [],
                      preSymptoms: [],
                      notes: ''
                    });
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg transition-colors font-medium text-base order-1 sm:order-2"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleTracker;
