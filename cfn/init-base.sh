#!/bin/bash

aws cloudformation create-stack \
    --stack-name headsup-server-base-stack \
    --template-body file://cfn/eb-application.cfn.json \
    --parameters file://cfn/base-launch-params.json \
    --capabilities CAPABILITY_IAM \
    --disable-rollback \
    --region us-east-2 || true

aws cloudformation wait stack-create-complete \
    --stack-name headsup-server-base-stack \
    --region us-east-2 || true
