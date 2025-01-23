export const MaxTicketsSlider = () => {
  return <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            Maximum Active Tickets
          </h4>
          <p className="text-sm text-gray-500">
            Set the maximum number of open tickets per agent
          </p>
        </div>
        <span className="text-2xl font-semibold text-gray-900">15</span>
      </div>
      <input type="range" min="5" max="30" defaultValue="15" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>5</span>
        <span>30</span>
      </div>
    </div>;
};