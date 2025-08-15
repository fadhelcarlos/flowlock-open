#!/bin/bash

# FlowLock Package Publishing Script
# This script publishes all FlowLock packages to npm

echo "FlowLock Package Publishing Script"
echo "=================================="
echo ""

# Check if user is logged in to npm
npm whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ You are not logged in to npm."
    echo "Please run: npm login"
    exit 1
fi

echo "✅ Logged in to npm as: $(npm whoami)"
echo ""

# Build all packages first
echo "Building all packages..."
pnpm build

# Publishing order (dependencies first)
PACKAGES=(
    "packages/uxspec"
    "packages/plugin-sdk"
    "packages/checks-core"
    "packages/runner"
    "packages/cli"
)

echo ""
echo "Publishing packages in dependency order..."
echo ""

for PACKAGE_DIR in "${PACKAGES[@]}"; do
    PACKAGE_NAME=$(node -p "require('./$PACKAGE_DIR/package.json').name")
    PACKAGE_VERSION=$(node -p "require('./$PACKAGE_DIR/package.json').version")
    
    echo "📦 Publishing $PACKAGE_NAME@$PACKAGE_VERSION..."
    
    # Check if package already exists
    npm view "$PACKAGE_NAME@$PACKAGE_VERSION" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "⚠️  Package $PACKAGE_NAME@$PACKAGE_VERSION already exists on npm. Skipping..."
        continue
    fi
    
    # Publish the package
    cd "$PACKAGE_DIR"
    npm publish --access public
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully published $PACKAGE_NAME@$PACKAGE_VERSION"
    else
        echo "❌ Failed to publish $PACKAGE_NAME@$PACKAGE_VERSION"
        echo "Please check the error above and try again."
        exit 1
    fi
    
    cd ../..
    echo ""
done

echo "🎉 All packages published successfully!"
echo ""
echo "You can now install the CLI globally with:"
echo "  npm install -g flowlock-cli"
echo ""
echo "Or add packages to your project:"
echo "  npm install flowlock-uxspec flowlock-runner flowlock-checks-core"