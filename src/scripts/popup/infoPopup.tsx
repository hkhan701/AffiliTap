import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

interface InfoPopupProps {
  message: string
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error'
}

export default function InfoPopup({ message, isOpen, onClose, type }: InfoPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg p-6 shadow-xl w-full max-w-md m-4">
        <div className="flex items-center mb-4">
          {type === 'success' ? (
            <FaCheckCircle className="text-green-500 text-2xl mr-2" />
          ) : (
            <FaTimesCircle className="text-red-500 text-2xl mr-2" />
          )}
          <h2 className={`text-xl font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {type === 'success' ? 'Success!' : 'Error!'}
          </h2>
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-150 ease-in-out"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}