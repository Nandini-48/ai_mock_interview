import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <div className="h-screen-minus-header flex flex-col">
      <h3 className="mb-4">Interview generation</h3>

      <div className="flex-1 relative">
        <Agent
          userName={user?.name!}
          userId={user?.id}
          profileImage={user?.profileURL}
          type="generate"
        />
      </div>
    </div>
  );
};

export default Page;