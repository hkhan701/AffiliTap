import { Users, ExternalLink } from 'lucide-react';

const FacebookGroupInvitationCard = () => {
  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">
              Join the AffiliTap Community!
            </p>
            <p className="text-xs text-blue-700 pr-4">
              Connect with fellow users, share tips, get support, and stay updated on new features in our{' '}
              <span className="font-semibold text-blue-800">Facebook group</span>!
            </p>
          </div>
        </div>
        <a
          href="https://www.facebook.com/groups/1573269843821803/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-white rounded-md border border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Join
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default FacebookGroupInvitationCard;
