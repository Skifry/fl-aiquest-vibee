import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Users, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuestList = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quests');
      if (response.ok) {
        const questsData = await response.json();
        setQuests(questsData);
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        <Card className="max-w-6xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold mb-2">Admin Quest Management</CardTitle>
                <p className="text-blue-100">Manage and view all quests</p>
              </div>
              <Link to="/admin">
                <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Back to Admin Panel
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {quests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => (
                  <Card key={quest.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                          <Play className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className={cn(
                          "text-xs px-3 py-1 rounded-full font-medium",
                          quest.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        )}>
                          {quest.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-xl text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                        {quest.title}
                      </h3>
                      
                      <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                        {quest.description}
                      </p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-slate-500">
                          <Users className="h-4 w-4 mr-2" />
                          <span>User: {quest.userName}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-500">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{quest.steps?.length || 0} steps</span>
                        </div>
                      </div>
                      
                      <Link to={`/quest/${quest.id}`} className="block">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium">
                          <Play className="h-4 w-4 mr-2" />
                          View Quest
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Play className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-3">No Quests Created Yet</h3>
                <p className="text-slate-500 mb-6">Start by creating your first quest in the admin panel.</p>
                <Link to="/admin">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3">
                    <Settings className="h-5 w-5 mr-2" />
                    Go to Admin Panel
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestList;