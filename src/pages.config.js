import Home from './pages/Home';
import Assistant from './pages/Assistant';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Library from './pages/Library';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

export const pagesConfig = {
  pages: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      title: 'LEXAID - Home',
      icon: 'Home',
      showInNav: true,
    },
    {
      path: '/assistant',
      name: 'Legal Assistant',
      component: Assistant,
      title: 'AI Legal Assistant',
      icon: 'Sparkles',
      showInNav: true,
    },
    {
      path: '/cases',
      name: 'My Cases',
      component: Cases,
      title: 'Case History',
      icon: 'FolderOpen',
      showInNav: true,
    },
    {
      path: '/library',
      name: 'Reference Library',
      component: Library,
      title: 'Constitution & Laws',
      icon: 'BookOpen',
      showInNav: true,
    },
    {
      path: '/documents',
      name: 'Document Simplifier',
      component: Documents,
      title: 'Document Simplifier',
      icon: 'FileText',
      showInNav: true,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      title: 'Settings',
      icon: 'Settings',
      showInNav: true,
    },
  ],
};
