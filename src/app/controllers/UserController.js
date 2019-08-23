import User from '../models/User';

class UserController {
  async store(req, res) {
    const userEmailExits = await User.findOne({ where: req.body.email });

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
}

export default new UserController();
