import { useState, useEffect } from 'react';
import { Zap, Layers, Mic, Link as LinkIcon, ArrowUpRight, FileText, Trash2, Volume2, Music, Plus, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerValue: string;
  action: string;
  actionValue: string;
  isActive: boolean;
}

const exampleRules = [
  { icon: Layers, title: 'Smart Sort', desc: 'Automatically organize notebooks into collections instantly based on their tags (e.g. #biology → Science).' },
  { icon: Zap, title: 'Auto-Researcher', desc: 'Trigger AI research agents to generate Briefing Docs and Study Guides as soon as you create a notebook.' },
  { icon: Mic, title: 'Podcast Pipelines', desc: 'Create a personal podcast feed. New Audio Overviews are automatically synced for listening on the go.' },
  { icon: LinkIcon, title: 'Domain Router', desc: 'Automatically route saved links to specific notebooks based on their website (e.g. YouTube → Watch Later).' },
  { icon: ArrowUpRight, title: 'The Escalator', desc: 'Create tag chains. Adding one tag (e.g. #urgent) can automatically trigger other tags (e.g. #todo).' },
  { icon: FileText, title: 'Template Engine', desc: 'Automatically apply custom note templates or prompt libraries when you tag a notebook.' },
  { icon: Trash2, title: 'The Cleaner', desc: 'Keep your workspace tidy. Automatically archive notebooks or delete episodes after you finish listening.' },
  { icon: Volume2, title: 'Audio Generator', desc: 'Automatically generate Audio Overviews when a notebook matches specific criteria (e.g. tag #podcast).' },
  { icon: Music, title: 'Podcast Curator', desc: 'Automatically add notebooks to specific podcast playlists based on tags.' },
];

export default function Automation() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'source_added',
    triggerValue: '',
    action: 'route_to_notebook',
    actionValue: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'automation_rules'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rulesData: AutomationRule[] = [];
      snapshot.forEach((doc) => {
        rulesData.push({ id: doc.id, ...doc.data() } as AutomationRule);
      });
      setRules(rulesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateRule = async () => {
    if (!user || !newRule.name || !newRule.triggerValue || !newRule.actionValue) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'automation_rules'), {
        userId: user.uid,
        ...newRule,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setShowCreateModal(false);
      setNewRule({
        name: '',
        trigger: 'source_added',
        triggerValue: '',
        action: 'route_to_notebook',
        actionValue: ''
      });
    } catch (error) {
      console.error("Error creating rule:", error);
      alert("Failed to create rule.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'automation_rules', id));
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-8 items-center overflow-y-auto">
      <div className="max-w-5xl w-full space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">Automation Rules</h1>
            <span className="px-2 py-1 border border-white/20 rounded text-sm text-white/60">Beta</span>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#FF0000] text-white rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>

        {/* Active Rules */}
        <div>
          <h2 className="text-xl font-bold mb-6 border-b border-white/20 pb-2">Your Active Rules</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/20 rounded-xl text-white/50">
              No automation rules created yet. Create one to automate your workflow.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="bg-white/5 border border-white/20 p-5 rounded-xl flex flex-col gap-3 relative group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{rule.name}</h3>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-white/30 hover:text-[#FF0000] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-white/60">
                    <span className="text-[#FF0000] font-medium">WHEN</span> {rule.trigger.replace('_', ' ')} is <span className="text-white font-medium">"{rule.triggerValue}"</span>
                  </div>
                  <div className="text-sm text-white/60">
                    <span className="text-[#FF0000] font-medium">THEN</span> {rule.action.replace('_', ' ')} <span className="text-white font-medium">"{rule.actionValue}"</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col items-center text-center space-y-6 mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold text-[#FF0000]">Automate Your Knowledge Workflow</h2>
            <p className="text-white/60 max-w-2xl text-lg">
              Stop organizing manually. With Automation Rules, you can auto-sort notebooks into collections, route web links to specific notebooks, and build powerful audio pipelines automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleRules.map((rule, idx) => (
              <div key={idx} className="bg-white text-black p-6 rounded-xl flex flex-col gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="flex items-center gap-3">
                  <rule.icon className="w-6 h-6 text-[#FF0000]" />
                  <h3 className="font-bold text-lg">{rule.title}</h3>
                </div>
                <p className="text-black/70 text-sm leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Create Automation Rule</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Rule Name</label>
                <input 
                  type="text" 
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="e.g., Route YouTube Links"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0000]"
                />
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#FF0000] mb-2">WHEN</label>
                  <select 
                    value={newRule.trigger}
                    onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF0000] mb-2"
                  >
                    <option value="source_added">Source is added from domain</option>
                    <option value="tag_added">Tag is added</option>
                    <option value="notebook_created">Notebook is created</option>
                  </select>
                  <input 
                    type="text" 
                    value={newRule.triggerValue}
                    onChange={(e) => setNewRule({...newRule, triggerValue: e.target.value})}
                    placeholder="e.g., youtube.com or #urgent"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0000]"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#FF0000] mb-2">THEN</label>
                  <select 
                    value={newRule.action}
                    onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF0000] mb-2"
                  >
                    <option value="route_to_notebook">Route to notebook</option>
                    <option value="add_to_collection">Add to collection</option>
                    <option value="generate_artifact">Generate artifact</option>
                  </select>
                  <input 
                    type="text" 
                    value={newRule.actionValue}
                    onChange={(e) => setNewRule({...newRule, actionValue: e.target.value})}
                    placeholder="e.g., Notebook ID or Collection ID"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0000]"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/50">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-white/60 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateRule}
                disabled={!newRule.name || !newRule.triggerValue || !newRule.actionValue || isCreating}
                className="px-6 py-2 bg-[#FF0000] text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
