import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
export const ProfileModal = ({ username }) => {
  return (
    <div className="flex items-center justify-between px-10">
      <h1 className="text-gray-200 text-3xl">Ultimatechess</h1>
      <div className="w-[150px]">
        {username ? (
          <div className="bg-gray-500 text-center text-xl rounded-2xl">
            <DropdownMenu>
              <DropdownMenuTrigger>Profile</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My profile</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Match History</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div> login </div>
        )}
      </div>
    </div>
  );
};
export default ProfileModal;
