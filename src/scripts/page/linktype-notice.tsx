import { AlertTriangle } from 'lucide-react';
import { LinkType } from '@/utils/utils';

interface LinkTypeNoticeProps {
  linkType: LinkType;
}

const LinkTypeNotice = ({ linkType }: LinkTypeNoticeProps) => {
  const getLinkInfo = (type: LinkType) => {
    switch (type) {
      case 'posttap':
        return {
          name: 'PostTap',
          url: 'https://creators.posttap.com'
        };
      case 'joylink':
        return {
          name: 'JoyLink',
          url: 'https://joylink.io'
        };
      case 'geniuslink':
        return {
          name: 'GeniusLink',
          url: 'https://my.geniuslink.com'
        };
      case 'linktwin':
        return {
          name: 'LinkTwin',
          url: 'https://linktw.in'
        };
      default:
        return null;
    }
  };

  const linkInfo = getLinkInfo(linkType);

  if (!linkInfo) return null;

  return (
    <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-amber-800">
        <p className="font-medium mb-1">Important</p>
        <p>
          You must be logged in to{' '}
          <a
            href={linkInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:no-underline transition-all"
          >
            {linkInfo.name}
          </a>{' '}
          in your browser to generate links using this service.
        </p>
      </div>
    </div>
  );
};

export default LinkTypeNotice;