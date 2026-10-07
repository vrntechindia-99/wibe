import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../presentation/shared/widgets/wibe_avatar.dart';
import '../../../../presentation/shared/widgets/wibe_text_field.dart';
import '../../../../presentation/shared/widgets/wibe_button.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _aboutController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _aboutController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(WibeSpacing.xl),
        child: Column(
          children: [
            // Avatar
            WibeAvatar(
              name: _nameController.text.isNotEmpty ? _nameController.text : 'User',
              radius: 60,
            ),
            const SizedBox(height: WibeSpacing.md),
            TextButton.icon(
              onPressed: () {
                // Change avatar
              },
              icon: const Icon(Icons.camera_alt),
              label: const Text('Change Photo'),
            ),
            const SizedBox(height: WibeSpacing.xl),

            // Name
            WibeTextField(
              label: 'Name',
              controller: _nameController,
              hint: 'Your name',
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: WibeSpacing.md),

            // About
            WibeTextField(
              label: 'About',
              controller: _aboutController,
              hint: 'Tell others about yourself',
              maxLines: 3,
              maxLength: 500,
            ),
            const SizedBox(height: WibeSpacing.xl),

            // Phone number (read-only)
            WibeTextField(
              label: 'Phone Number',
              hint: '+1 234 567 890',
              enabled: false,
            ),
            const SizedBox(height: WibeSpacing.xl),

            // Save button
            WibeButton(
              text: 'Save Changes',
              onPressed: () {
                // Save profile
              },
              width: double.infinity,
            ),
          ],
        ),
      ),
    );
  }
}