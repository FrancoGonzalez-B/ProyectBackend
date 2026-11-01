const mapUser = (user) => {
  const data = user.toJSON ? user.toJSON() : user;

  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
  };
};

module.exports = { mapUser };
