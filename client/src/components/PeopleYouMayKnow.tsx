import React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks/hook";
import { fetchPeopleYouMayKnow } from "../store/friends-slice";
const PeopleYouMayKnow: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, peopleYouMayKnow } = useAppSelector(
    (state) => state.friends
  );
  React.useEffect(() => {
    dispatch(fetchPeopleYouMayKnow());
  }, [dispatch]);
  if (loading) {
    return <div>Loading....</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!loading && peopleYouMayKnow.length === 0) {
    return <div>No Users</div>;
  }
  return (
    <div>
      {peopleYouMayKnow.map((person) => (
        <div key={person.id}>
          {person.username}
          {person.friendship_status}
        </div>
      ))}
    </div>
  );
};

export default PeopleYouMayKnow;
