import User from '../models/User';

class UserController {
  async store(req, res) {
    const userEmailExits = await User.findOne({ where: { email: req.body.email } });

    if (userEmailExits) {
      return res.status(400).json({ error: "User email already exists" });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  //Function to update user data
  async update(req, res) {

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userEmailExits = await User.findOne({ where: { email: req.body.email } });

      if (userEmailExits) {
        return res.status(400).json({ error: "User email already exists" });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = await user.update(req.body);

    return res.json({
      id,
      email,
      name
    });
  }
}

export default new UserController();
