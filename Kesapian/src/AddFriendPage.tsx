import React from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import "./AddFriendPage.css";
export const AddFriendPage = (): JSX.Element => {
  
  const friendRecommendations = [
    {
      id: 1,
      name: "David Wayne",
      distance: "800m From Your Position",
      avatar: "/avatar.png",
      isAvatarBg: true,
    },
    {
      id: 2,
      name: "Edward Davidson",
      distance: "1.2km From Your Position",
      avatar: "/rectangle.png",
      isAvatarBg: false,
    },
    {
      id: 3,
      name: "Angela Kelly",
      distance: "1.5km From Your Position",
      avatar: "/rectangle-1.png",
      isAvatarBg: false,
    },
    {
      id: 4,
      name: "Dennis Borer",
      distance: "2km From Your Position",
      avatar: "/rectangle-2.png",
      isAvatarBg: false,
    },
  ];

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-[430px] h-[932px] relative">
        {/* Navigation bar in middle */}
            <div className="absolute w-[430px] h-[100px] bottom-0 bg-[#ececec] shadow-[0px_4px_4px_#00000040]">          <img
            className="w-[393px] h-[100px] mx-auto"
            alt="Navbar"
            src="/navbar.svg"
          />
        </div>

        {/* Header */}
        <div className="w-full h-[119px]">
          <img
            className="w-full h-[104px]"
            alt="Rectangle"
            src="/rectangle-107.svg"
          />
          <div className="w-[393px] mx-auto mt-[95px] font-medium text-[#292929] text-base text-center font-['Poppins',Helvetica]">
            Add Friends
          </div>
        </div>

        {/* Recommendations section */}
        <div className="mt-16 mx-6">
          <h2 className="font-medium text-black text-base font-['Poppins',Helvetica]">
            Recomendations
          </h2>

          {/* Recommendations placeholder */}
          <div className="w-[390px] h-[219px] mt-5 bg-[#d9d9d9]" />

          {/* Friends list */}
          <div className="mt-6 space-y-6">
            {friendRecommendations.map((friend) => (
              <Card key={friend.id} className="border-none shadow-none">
                <CardContent className="p-0 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {friend.isAvatarBg ? (
                      <div
                        className="w-[42px] h-[42px] rounded-[100px] bg-cover bg-center"
                        style={{ backgroundImage: `url(${friend.avatar})` }}
                      />
                    ) : (
                      <img
                        className="w-[42px] h-[42px] object-cover"
                        alt={`${friend.name}'s avatar`}
                        src={friend.avatar}
                      />
                    )}
                    <div className="flex flex-col items-start justify-center gap-2">
                      <div className="font-bold text-neutralneutral-900 text-base font-['Roboto',Helvetica]">
                        {friend.name}
                      </div>
                      <div className="font-bold text-neutralneutral-300 text-xs text-center font-['Roboto',Helvetica]">
                        {friend.distance}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-[26px] w-[83px] rounded-[15px] bg-[#d9d9d9] border-none hover:bg-[#c9c9c9]"
                  >
                    <span className="font-medium text-black text-sm font-['Poppins',Helvetica]">
                      View
                    </span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};